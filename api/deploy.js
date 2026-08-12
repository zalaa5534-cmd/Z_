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
    // Token محفوظ في Vercel Environment Variables
    const token = process.env.VERCEL_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "VERCEL_API_TOKEN is missing"
      });
    }

    // قراءة البيانات
    const body = req.body;

    if (!body || !Array.isArray(body.files)) {
      return res.status(400).json({
        error: "No files received"
      });
    }

    if (body.files.length === 0) {
      return res.status(400).json({
        error: "No files selected"
      });
    }

    // تحويل path القادم من index.html إلى file
    const files = body.files
      .map((item) => {
        return {
          file: String(item.path || ""),
          data: String(item.data || "")
        };
      })
      .filter((item) => item.file && item.data);

    if (files.length === 0) {
      return res.status(400).json({
        error: "Files are empty"
      });
    }

    /*
      مهم:
      ده اسم مشروعك الموجود بالفعل على Vercel.
      مش بنعمل Project جديد كل مرة.
    */
    const projectName = "z";

    // إنشاء Deployment داخل المشروع الموجود
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
          files: files,
          target: "production"
        })
      }
    );

    const result = await response.json();

    // Vercel رفض الطلب
    if (!response.ok) {
      console.error("Vercel API Error:", result);

      return res.status(response.status).json({
        error:
          result?.error?.message ||
          "Vercel deployment failed",

        details: result
      });
    }

    // التأكد إن Vercel رجع رابط
    if (!result.url) {
      return res.status(500).json({
        error: "Deployment created but no URL was returned",
        deploymentId: result.id
      });
    }

    // الرابط النهائي
    const url = `https://${result.url}`;

    return res.status(200).json({
      success: true,
      id: result.id,
      url: url
    });

  } catch (error) {
    console.error("Deploy Error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Internal server error"
    });
  }
}
