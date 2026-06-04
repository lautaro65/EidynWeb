const MESHY_API_KEY = process.env.MESHY_API_KEY || "";
const MESHY_BASE_URL = "https://api.meshy.ai/openapi/v1";

// Activar modo mock para pruebas sin API Key
const USE_MOCK = true;

interface MeshyTaskResponse {
  result: string; // The Task ID
}

interface MeshyStatusResponse {
  id: string;
  model_urls: {
    glb: string;
    fbx?: string;
    obj?: string;
    mtl?: string;
  };
  thumbnail_url: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "EXPIRED";
  progress: number;
  task_error?: {
    message: string;
  };
}

export async function createMeshyTask(imageUrl: string): Promise<string> {
  if (USE_MOCK) {
    console.log("[MOCK] Creando tarea en Meshy para la imagen:", imageUrl);
    // Podemos simular un ID de tarea distinto dependiendo del tipo de prenda si se supiera,
    // o simplemente generar uno aleatorio.
    return `mock_task_${Date.now()}`;
  }

  const response = await fetch(`${MESHY_BASE_URL}/image-to-3d`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MESHY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl,
      enable_pbr: true,
      should_remesh: true, // often helps with garments
      should_topology: true, // cleans geometry
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Meshy task: ${errorText}`);
  }

  const data = (await response.json()) as MeshyTaskResponse;
  return data.result;
}

export async function checkMeshyTaskStatus(taskId: string): Promise<MeshyStatusResponse> {
  if (USE_MOCK && taskId.startsWith("mock_task_")) {
    console.log("[MOCK] Consultando estado de la tarea:", taskId);
    
    // Devolvemos SUCCEEDED inmediatamente con un modelo de prueba
    return {
      id: taskId,
      model_urls: { 
        glb: "http://localhost:3000/models/remera.obj" // Usando el modelo de remera subido por el usuario
      },
      thumbnail_url: "https://via.placeholder.com/150",
      status: "SUCCEEDED",
      progress: 100,
    };
  }

  const response = await fetch(`${MESHY_BASE_URL}/image-to-3d/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${MESHY_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Meshy status for task ${taskId}: ${errorText}`);
  }

  return (await response.json()) as MeshyStatusResponse;
}
