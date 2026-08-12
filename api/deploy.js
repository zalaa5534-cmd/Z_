export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const token = process.env.VERCEL_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "VERCEL_API_TOKEN is missing"
      });
    }

    const body = req.body;

    if (!body || !Array.isArray(body.files) || body.files.length === 0) {
      return res.status(400).json({
        error: "No files received"
      });
    }

    const files = body.files
      .map((item) => ({
        file: String(item.path || ""),
        data: String(item.data || "")
      }))
      .filter((item) => item.file && item.data);

    if (files.length === 0) {
      return res.status(400).json({
        error: "Files are empty"
      });
    }

    const projectName = "z-eta-neon";

    const response = await fetch(
      "https://api.vercel.com/v13/deployments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: projectName,
          files,
          target: "preview"
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Vercel API Error:", result);

      return res.status(response.status).json({
        error:
          result?.error?.message ||
          "Vercel deployment failed"
      });
    }

    if (!result.url) {
      return res.status(500).json({
        error: "Deployment created but Vercel returned no URL"
      });
    }

    return res.status(200).json({
      success: true,
      id: result.id,
      url: `https://${result.url}`
    });

  } catch (error) {
    console.error("Deploy Error:", error);

    return res.status(500).json({
      error: error?.message || "Internal server error"
    });
  }
}
