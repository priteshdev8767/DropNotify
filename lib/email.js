console.log("BREVO:", process.env.BREVO_API_KEY);

export async function sendPriceDropAlert(
  userEmail,
  product,
  oldPrice,
  newPrice
) {
  try {

    const priceDrop = oldPrice - newPrice;
    const percentageDrop = ((priceDrop / oldPrice) * 100).toFixed(1);

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },

        body: JSON.stringify({

          sender: {
            email: process.env.BREVO_FROM_EMAIL,
            name: "Price Tracker",
          },

          to: [
            {
              email: userEmail,
            },
          ],

          subject: `⚡ Price Drop Alert: ${product.name} is now ${percentageDrop}% cheaper!`,

          htmlContent: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Price Drop Alert</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

    * { margin:0; padding:0; box-sizing:border-box; }
    html, body {
      margin:0 !important; padding:0 !important;
      width:100% !important; background-color:#0d0d0d !important;
      font-family:'DM Sans',-apple-system,BlinkMacSystemFont,Arial,sans-serif;
      -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;
    }

    @media only screen and (max-width: 620px) {
      .outer-pad   { padding: 0 !important; }
      .email-wrap  { border-radius: 0 !important; }
      .hdr-cell    { padding: 36px 18px 28px !important; }
      .h1          { font-size: 36px !important; }
      .body-cell   { padding: 0 16px 24px !important; }
      .price-table { display:block !important; width:100% !important; }
      .price-was   { display:block !important; width:100% !important;
                     border-radius:12px !important; padding:14px 16px !important;
                     margin-bottom:10px !important; }
      .price-now   { display:block !important; width:100% !important;
                     border-radius:12px !important; padding:14px 16px !important; }
      .arrow-cell  { display:none !important; }
      .old-amt     { font-size:20px !important; }
      .new-amt     { font-size:24px !important; }
      .pct-head    { font-size:18px !important; }
      .cta-btn     { padding:14px 30px !important; font-size:14px !important; }
      .footer-cell { padding:22px 16px !important; }
      .product-img { width:60px !important; height:60px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;width:100%;">

<!-- FULL-WIDTH OUTER TABLE -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background-color:#0d0d0d;width:100%;margin:0;padding:0;">
  <tr>
    <td class="outer-pad" align="center" valign="top" style="padding:32px 16px;">

      <!-- INNER CONTAINER — max 680px -->
      <table width="680" cellpadding="0" cellspacing="0" border="0"
        style="width:100%;max-width:680px;">

        <!-- ===== HEADER ===== -->
        <tr>
          <td style="border-radius:20px 20px 0 0;overflow:hidden;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="background:linear-gradient(135deg,#1a0a00 0%,#2d1200 40%,#1a0a00 100%);
                border-radius:20px 20px 0 0;
                border:1px solid rgba(250,93,25,0.35);
                border-bottom:none;
                overflow:hidden;">
              <tr>
                <td class="hdr-cell"
                  style="padding:56px 48px 44px;text-align:center;position:relative;overflow:hidden;">

                  <!-- Glow blobs -->
                  <div style="position:absolute;top:-40px;left:-40px;width:260px;height:260px;
                    background:radial-gradient(circle,rgba(250,93,25,0.28) 0%,transparent 70%);
                    pointer-events:none;"></div>
                  <div style="position:absolute;bottom:-30px;right:-30px;width:220px;height:220px;
                    background:radial-gradient(circle,rgba(255,140,66,0.22) 0%,transparent 70%);
                    pointer-events:none;"></div>

                  <!-- Badge -->
                  <div style="display:inline-block;background:rgba(250,93,25,0.15);
                    border:1px solid rgba(250,93,25,0.55);border-radius:100px;
                    padding:7px 20px;margin-bottom:22px;">
                    <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;
                      font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#FA5D19;">
                      ⚡ Limited Time
                    </span>
                  </div>

                  <!-- Headline -->
                  <h1 class="h1" style="font-family:'Playfair Display',Georgia,serif;
                    font-size:56px;font-weight:900;line-height:1.05;color:#ffffff;margin-bottom:8px;">
                    Price<br>
                    <span style="background:linear-gradient(90deg,#FA5D19,#FF8C42,#FFBF00);
                      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                      background-clip:text;color:#FA5D19;">
                      Dropped.
                    </span>
                  </h1>

                  <p style="font-family:'DM Sans',Arial,sans-serif;font-size:15px;
                    color:rgba(255,255,255,0.45);margin-top:14px;letter-spacing:0.3px;">
                    Something on your watchlist just got cheaper.
                  </p>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== BODY ===== -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="background:#141414;
                border-left:1px solid rgba(250,93,25,0.3);
                border-right:1px solid rgba(250,93,25,0.3);">
              <tr>
                <td class="body-cell" style="padding:0 44px 36px;">

                  <!-- Divider -->
                  <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(250,93,25,0.45),transparent);margin-bottom:32px;"></div>

                  <!-- Product image + name -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      ${product.image_url ? `
                      <td width="88" valign="middle">
                        <div style="width:80px;height:80px;background:#1f1f1f;
                          border:1px solid rgba(255,255,255,0.1);border-radius:14px;overflow:hidden;">
                          <img class="product-img" src="${product.image_url}" alt="${product.name}"
                            width="80" height="80"
                            style="display:block;width:80px;height:80px;object-fit:cover;border-radius:14px;">
                        </div>
                      </td>
                      <td valign="middle" style="padding-left:18px;">
                      ` : `<td valign="middle">`}
                        <p style="font-family:'DM Sans',Arial,sans-serif;font-size:10px;font-weight:600;
                          letter-spacing:2.5px;text-transform:uppercase;color:#FA5D19;margin-bottom:7px;">
                          Product Alert
                        </p>
                        <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:21px;
                          font-weight:700;color:#ffffff;line-height:1.35;">
                          ${product.name}
                        </h2>
                      </td>
                    </tr>
                  </table>

                  <!-- % Drop Banner -->
                  <div style="margin:26px 0;
                    background:linear-gradient(135deg,rgba(250,93,25,0.13),rgba(255,191,0,0.07));
                    border:1px solid rgba(250,93,25,0.32);border-radius:14px;padding:18px 22px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" valign="middle">
                          <span style="font-size:30px;line-height:1;">🔥</span>
                        </td>
                        <td valign="middle" style="padding-left:14px;">
                          <p style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;
                            color:rgba(255,255,255,0.45);margin-bottom:3px;">
                            Price just dropped
                          </p>
                          <p class="pct-head" style="font-family:'Playfair Display',serif;
                            font-size:23px;font-weight:900;color:#FA5D19;">
                            ${percentageDrop}% OFF — act fast!
                          </p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Price Comparison -->
                  <table class="price-table" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="margin-bottom:28px;">
                    <tr>
                      <!-- Old -->
                      <td class="price-was" width="47%" valign="top"
                        style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);
                        border-radius:14px;padding:20px 22px;">
                        <p style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:600;
                          letter-spacing:1.5px;text-transform:uppercase;
                          color:rgba(255,255,255,0.3);margin-bottom:8px;">Was</p>
                        <p class="old-amt" style="font-family:'Playfair Display',serif;font-size:28px;
                          font-weight:700;color:rgba(255,255,255,0.22);
                          text-decoration:line-through;text-decoration-color:rgba(255,80,80,0.5);">
                          ${product.currency} ${oldPrice.toFixed(2)}
                        </p>
                      </td>

                      <!-- Arrow -->
                      <td class="arrow-cell" width="6%" style="text-align:center;vertical-align:middle;padding:0 4px;">
                        <span style="color:rgba(255,255,255,0.18);font-size:22px;">→</span>
                      </td>

                      <!-- New -->
                      <td class="price-now" width="47%" valign="top"
                        style="background:linear-gradient(135deg,rgba(250,93,25,0.16),rgba(255,140,66,0.08));
                        border:1px solid rgba(250,93,25,0.38);border-radius:14px;padding:20px 22px;">
                        <p style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:600;
                          letter-spacing:1.5px;text-transform:uppercase;color:#FA5D19;margin-bottom:8px;">Now</p>
                        <p class="new-amt" style="font-family:'Playfair Display',serif;font-size:32px;
                          font-weight:900;color:#ffffff;">
                          ${product.currency} ${newPrice.toFixed(2)}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Savings Pill -->
                  <div style="text-align:center;margin-bottom:30px;">
                    <div style="display:inline-block;
                      background:linear-gradient(90deg,#1a3d1a,#0f2d0f);
                      border:1px solid rgba(34,197,94,0.38);border-radius:100px;padding:12px 30px;">
                      <span style="font-family:'DM Sans',Arial,sans-serif;font-size:15px;
                        font-weight:600;color:#4ade80;">
                        ✓&nbsp; You save ${product.currency} ${priceDrop.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <!-- CTA -->
                  <div style="text-align:center;">
                    <a class="cta-btn" href="${product.url}"
                      style="display:inline-block;
                        background:linear-gradient(135deg,#FA5D19 0%,#FF8C42 100%);
                        color:#ffffff;text-decoration:none;
                        font-family:'DM Sans',Arial,sans-serif;
                        font-size:16px;font-weight:700;letter-spacing:0.5px;
                        padding:17px 54px;border-radius:100px;
                        box-shadow:0 10px 36px rgba(250,93,25,0.45),0 2px 10px rgba(0,0,0,0.45);">
                      Grab This Deal &nbsp;→
                    </a>
                    <p style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;
                      color:rgba(255,255,255,0.22);margin-top:13px;">
                      Price may change. Act before it's gone.
                    </p>
                  </div>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== FOOTER ===== -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="background:#0f0f0f;border-radius:0 0 20px 20px;
                border:1px solid rgba(250,93,25,0.3);
                border-top:1px solid rgba(255,255,255,0.05);">
              <tr>
                <td class="footer-cell" style="padding:30px 44px;text-align:center;">

                  <p style="font-family:'Playfair Display',serif;font-size:19px;font-weight:700;
                    color:#FA5D19;letter-spacing:1px;margin-bottom:12px;">
                    Price Tracker
                  </p>

                  <p style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;
                    color:rgba(255,255,255,0.22);line-height:2;">
                    You're receiving this because you're tracking this item.<br>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}"
                      style="color:#FA5D19;text-decoration:none;font-weight:500;">
                      View all tracked products
                    </a>
                    &nbsp;·&nbsp;
                    <a href="#" style="color:rgba(255,255,255,0.28);text-decoration:none;">Unsubscribe</a>
                  </p>

                  <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(250,93,25,0.22),transparent);margin-top:22px;"></div>

                  <p style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;
                    color:rgba(255,255,255,0.1);margin-top:15px;letter-spacing:0.5px;">
                    © 2025 Price Tracker. All rights reserved.
                  </p>

                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!-- /inner container -->

    </td>
  </tr>
</table>

</body>
</html>`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Brevo error:", data);
      return { error: data };
    }

    console.log("Email sent successfully");
    return { success: true };

  } catch (error) {

    console.error("Email error:", error);
    return { error: error.message };

  }
}