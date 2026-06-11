(function() {
  // 1. Find the script tag that loaded this SDK
  const currentScript = document.currentScript || document.querySelector('script[src*="eidyn-sdk.js"]');
  if (!currentScript) return;

  const apiKey = currentScript.getAttribute('data-api-key');
  const rawSku = currentScript.getAttribute('data-sku');
  
  // Fallback for Shopify: Try to read the global meta variable if data-sku is not provided
  let sku = rawSku;
  if (!sku) {
     if (window.meta && window.meta.product && window.meta.product.variants) {
         sku = window.meta.product.variants[0].sku || window.meta.product.handle;
     } else {
         const el = document.querySelector('[data-product-sku], [name="sku"]');
         if (el) sku = el.value || el.getAttribute('data-product-sku');
     }
  }

  if (!apiKey || !sku) {
    return;
  }

  // 2. Fetch initialization config from Eidyn
  let baseUrl = 'http://localhost:3000';
  try {
      const scriptUrl = new URL(currentScript.src);
      baseUrl = scriptUrl.origin;
  } catch {}

  fetch(`${baseUrl}/api/v1/widget/init?apiKey=${encodeURIComponent(apiKey)}&sku=${encodeURIComponent(sku)}`)
    .then(res => res.json())
    .then(data => {
      if (data.hasModel && data.garmentId) {
        initWidgetUI(data, baseUrl);
      }
    })
    .catch(() => {
      // Silently fail if there's a network error
    });

  function initWidgetUI(configData, baseUrl) {
      const config = configData.config;
      const themeColor = config.brandColor || "#000000";
      const isDark = config.theme === "dark";

      // Create a container for our button.
      let container = document.getElementById('eidyn-3d-button');
      if (!container) {
          container = document.createElement('div');
          container.style.marginTop = "1rem";
          container.style.marginBottom = "1rem";
          
          const atc = document.querySelector('form[action="/cart/add"], button.add-to-cart, button[name="add"], .product-form__submit');
          if (atc && atc.parentNode) {
              atc.parentNode.insertBefore(container, atc.nextSibling);
          } else {
              container.style.position = 'fixed';
              container.style.bottom = '20px';
              container.style.right = '20px';
              container.style.zIndex = '9999';
              document.body.appendChild(container);
          }
      }

      // Draw the button
      const btn = document.createElement('button');
      btn.innerHTML = `<svg style="width:20px;height:20px;margin-right:8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg> Ver en 3D`;
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.width = "100%";
      btn.style.padding = "16px 24px";
      btn.style.backgroundColor = themeColor;
      btn.style.color = "#ffffff";
      btn.style.border = "none";
      btn.style.borderRadius = "9999px"; // Pill shape
      btn.style.fontSize = "16px";
      btn.style.fontWeight = "600";
      btn.style.cursor = "pointer";
      btn.style.boxShadow = "0 4px 14px 0 rgba(0,0,0,0.15)";
      btn.style.transition = "transform 0.2s, box-shadow 0.2s";
      
      btn.onmouseover = () => { btn.style.transform = "translateY(-2px)"; btn.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)"; };
      btn.onmouseout = () => { btn.style.transform = "translateY(0)"; btn.style.boxShadow = "0 4px 14px 0 rgba(0,0,0,0.15)"; };

      container.appendChild(btn);

      // Modal Logic
      let modal = null;

      btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (modal) {
              modal.style.display = "flex";
              return;
          }

          modal = document.createElement('div');
          modal.style.position = "fixed";
          modal.style.top = "0";
          modal.style.left = "0";
          modal.style.width = "100vw";
          modal.style.height = "100vh";
          modal.style.backgroundColor = isDark ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.7)";
          modal.style.zIndex = "2147483647"; // Max z-index
          modal.style.display = "flex";
          modal.style.alignItems = "center";
          modal.style.justifyContent = "center";
          modal.style.backdropFilter = "blur(10px)";

          const closeBtn = document.createElement('button');
          closeBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
          closeBtn.style.position = "absolute";
          closeBtn.style.top = "24px";
          closeBtn.style.right = "24px";
          closeBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
          closeBtn.style.color = "white";
          closeBtn.style.border = "none";
          closeBtn.style.borderRadius = "50%";
          closeBtn.style.width = "48px";
          closeBtn.style.height = "48px";
          closeBtn.style.display = "flex";
          closeBtn.style.alignItems = "center";
          closeBtn.style.justifyContent = "center";
          closeBtn.style.cursor = "pointer";
          closeBtn.style.zIndex = "2";
          closeBtn.style.transition = "background-color 0.2s";
          closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = "rgba(255,255,255,0.2)"; };
          closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = "rgba(255,255,255,0.1)"; };
          closeBtn.onclick = () => { modal.style.display = "none"; };

          const iframe = document.createElement('iframe');
          // En la versión final apuntaremos al locale correspondiente o omitiremos el locale
          iframe.src = `${baseUrl}/es/widget?garmentId=${configData.garmentId}&apiKey=${encodeURIComponent(apiKey)}`;
          iframe.style.width = "100%";
          iframe.style.maxWidth = "1200px";
          iframe.style.height = "90vh";
          iframe.style.maxHeight = "800px";
          iframe.style.border = "none";
          iframe.style.borderRadius = "24px";
          iframe.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.5)";
          
          modal.appendChild(closeBtn);
          modal.appendChild(iframe);
          document.body.appendChild(modal);
      });
  }
})();
