export default async function handler(req, res) {
  // CORS
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
    // لازم التوكن يكون محفوظ في Vercel Environment Variables
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

    // تنظيف الملفات والتأكد من وجود أسماء صحيحة
    const files = body.files.map((file) => ({
      file: String(file.file || ""),
      data: String(file.data || "")
    })).filter((file) => file.file && file.data);

    if (!files.length) {
      return res.status(400).json({
        error: "Files are empty"
      });
    }

    // اسم مشروع مؤقت وفريد
    const projectName =
      "z-project-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 7);

    // إنشاء Deployment حقيقي على Vercel
    const response = await fetch(
      "https://api.vercel.com/v13/deployments",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: projectName,
          files: files,
          target: "production"
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Vercel API Error:", result);

      return res.status(response.status).json({
        error: result.error?.message || "Vercel deployment failed",
        details: result
      });
    }

    // الرابط النهائي
    const url = result.url
      ? `https://${result.url}`
      : null;

    return res.status(200).json({
      success: true,
      id: result.id,
      url: url,
      deployment: result
    });

  } catch (error) {
    console.error("Deploy Error:", error);

    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
      }
