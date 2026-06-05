import { NodeIO, Accessor, Mesh, Document } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
// @ts-expect-error - No types available for draco3dgltf
import draco3d from 'draco3dgltf';

/**
 * Transfers skin weights from a rigged Prefab GLB to a static Garment GLB.
 * 
 * @param garmentBuffer The optimized but static GLB buffer from Meshy.
 * @param prefabBuffer The rigged Prefab GLB buffer with an Armature and a reference mesh.
 * @returns A rigged GLB buffer.
 */
export async function autoRigGarment(garmentBuffer: Uint8Array, prefabBuffer: Uint8Array): Promise<Buffer> {
  const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });

  const garmentDoc = await io.readBinary(new Uint8Array(garmentBuffer));
  const prefabDoc = await io.readBinary(new Uint8Array(prefabBuffer));

  // 1. Find the primary mesh in the garment
  const garmentMeshes = garmentDoc.getRoot().listMeshes();
  if (garmentMeshes.length === 0) throw new Error("No mesh found in garment GLB");
  const garmentMesh = garmentMeshes[0];
  const garmentPrimitive = garmentMesh.listPrimitives()[0];
  const gPos = garmentPrimitive.getAttribute('POSITION');
  const gNorm = garmentPrimitive.getAttribute('NORMAL');
  const gTex = garmentPrimitive.getAttribute('TEXCOORD_0');
  const gInd = garmentPrimitive.getIndices();
  
  if (!gPos || !gInd) throw new Error("Garment has no POSITION or INDICES attribute");

  // 2. Find the primary rigged mesh in the prefab
  const prefabMeshes = prefabDoc.getRoot().listMeshes();
  let prefabMesh: Mesh | null = null;
  
  for (const m of prefabMeshes) {
    const prim = m.listPrimitives()[0];
    if (prim && prim.getAttribute('JOINTS_0') && prim.getAttribute('WEIGHTS_0')) {
      prefabMesh = m;
      break;
    }
  }

  const prefabSkins = prefabDoc.getRoot().listSkins();
  if (!prefabMesh || prefabSkins.length === 0) {
    console.warn("Prefab does not contain a rigged mesh or skin. Returning original garment.");
    return Buffer.from(garmentBuffer);
  }

  const pPrim = prefabMesh.listPrimitives()[0];
  const pPos = pPrim.getAttribute('POSITION')!;
  const pJoints = pPrim.getAttribute('JOINTS_0')!;
  const pWeights = pPrim.getAttribute('WEIGHTS_0')!;

  // 3. Create new Arrays for JOINTS_0 and WEIGHTS_0 on the garment
  const gVertexCount = gPos.getCount();
  const newJointsData = new Uint16Array(gVertexCount * 4);
  const newWeightsData = new Float32Array(gVertexCount * 4);

  // 4. Nearest-neighbor skin weight transfer
  const pVertexCount = pPos.getCount();
  const gCoords = [0, 0, 0];
  const pCoords = [0, 0, 0];
  const pJ = [0, 0, 0, 0];
  const pW = [0, 0, 0, 0];

  for (let i = 0; i < gVertexCount; i++) {
    gPos.getElement(i, gCoords);
    const [gx, gy, gz] = gCoords;

    let minDstSq = Infinity;
    let closestIndex = 0;

    for (let j = 0; j < pVertexCount; j++) {
      pPos.getElement(j, pCoords);
      const [px, py, pz] = pCoords;

      const dstSq = (gx - px) ** 2 + (gy - py) ** 2 + (gz - pz) ** 2;
      if (dstSq < minDstSq) {
        minDstSq = dstSq;
        closestIndex = j;
      }
    }

    pJoints.getElement(closestIndex, pJ);
    pWeights.getElement(closestIndex, pW);

    newJointsData[i * 4 + 0] = pJ[0];
    newJointsData[i * 4 + 1] = pJ[1];
    newJointsData[i * 4 + 2] = pJ[2];
    newJointsData[i * 4 + 3] = pJ[3];

    newWeightsData[i * 4 + 0] = pW[0];
    newWeightsData[i * 4 + 1] = pW[1];
    newWeightsData[i * 4 + 2] = pW[2];
    newWeightsData[i * 4 + 3] = pW[3];
  }

  // 5. Replace prefab primitive attributes with garment arrays
  // We recreate accessors in prefabDoc from garment arrays
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createAccessor = (name: string, array: any, type: any, doc: Document) => {
    return doc.createAccessor(name).setType(type).setArray(array);
  };

  const newPosAccessor = createAccessor('POSITION', gPos.getArray()!, Accessor.Type.VEC3, prefabDoc);
  const newIndAccessor = createAccessor('INDICES', gInd.getArray()!, Accessor.Type.SCALAR, prefabDoc);
  const newJointsAccessor = createAccessor('JOINTS_0', newJointsData, Accessor.Type.VEC4, prefabDoc);
  const newWeightsAccessor = createAccessor('WEIGHTS_0', newWeightsData, Accessor.Type.VEC4, prefabDoc);
  
  pPrim.setAttribute('POSITION', newPosAccessor);
  pPrim.setAttribute('JOINTS_0', newJointsAccessor);
  pPrim.setAttribute('WEIGHTS_0', newWeightsAccessor);
  pPrim.setIndices(newIndAccessor);

  if (gNorm) {
    pPrim.setAttribute('NORMAL', createAccessor('NORMAL', gNorm.getArray()!, Accessor.Type.VEC3, prefabDoc));
  } else {
    pPrim.setAttribute('NORMAL', null);
  }

  if (gTex) {
    pPrim.setAttribute('TEXCOORD_0', createAccessor('TEXCOORD_0', gTex.getArray()!, Accessor.Type.VEC2, prefabDoc));
  } else {
    pPrim.setAttribute('TEXCOORD_0', null);
  }

  // Set the material from the garment (we don't copy the material properly since it's hard, 
  // but if we need to, we can just leave the prefab material or copy texture bytes)
  // For now, we will just use the geometry.

  const finalGlb = await io.writeBinary(prefabDoc);
  return Buffer.from(finalGlb);
}
