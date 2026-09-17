/**
 * BiometricService.js
 * 
 * Interacts with Mantra MIS100 V2 Iris Scanner
 */

export const captureFingerprint = async () => {
  // Fingerprint is captured via iframe messaging directly in components
  // This is a placeholder since the iframe logic is handled in the UI
  return { success: false, msg: "Use iframe messaging in component instead." };
};

export const captureIris = async () => {
  console.log("Initializing Mantra MIS100 V2 Iris Scanner...");
  const rdServicePort = "11100";
  const baseUrl = `http://127.0.0.1:${rdServicePort}`;

  try {
    // 1. Discover Device
    await fetch(`${baseUrl}/rd/info`, { method: 'RDSERVICE' });
    
    // 2. Capture Iris
    const pidOptions = `<?xml version="1.0"?>
      <PidOptions ver="2.0">
          <Opts fCount="0" fType="0" iCount="1" iType="0" pCount="0" pType="0" format="0" pidVer="2.0" timeout="10000" env="P" />
      </PidOptions>`;
      
    const response = await fetch(`${baseUrl}/rd/capture`, {
        method: 'CAPTURE',
        headers: { 'Content-Type': 'text/xml' },
        body: pidOptions
    });
    
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    const respNode = xmlDoc.getElementsByTagName("Resp")[0];
    if (respNode && respNode.getAttribute("errCode") === "0") {
        const hmacNode = xmlDoc.getElementsByTagName("Hmac")[0];
        const scannedIrisHash = hmacNode ? hmacNode.textContent : null;
        if (scannedIrisHash) {
            return { success: true, hash: scannedIrisHash };
        } else {
            throw new Error("Iris capture succeeded but Hash ID was missing.");
        }
    } else {
        const errInfo = respNode ? respNode.getAttribute("errInfo") : "Unknown Error";
        throw new Error(errInfo);
    }
  } catch (error) {
    console.error("Iris Capture Failed:", error);
    throw error;
  }
};

