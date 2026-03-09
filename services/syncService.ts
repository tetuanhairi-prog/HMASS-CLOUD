
export const syncToSheets = async (payload: any, url: string) => {
  if (!url || !url.startsWith("https://script.google.com")) return;
  
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors", // Penting untuk Google Apps Script POST
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Ralat sinkronisasi (Hantar):", err);
  }
};

export const fetchFromSheets = async (url: string) => {
  if (!url || !url.startsWith("https://script.google.com")) return null;
  
  try {
    // Menambah timestamp supaya pelayar tidak ambil data 'cached' yang lama
    const cacheBuster = `?t=${Date.now()}`;
    const finalUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}${cacheBuster}`;
    
    const response = await fetch(finalUrl, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn("Sistem sedang offline atau URL Google Script tidak sah:", err);
  }
  return null;
};
