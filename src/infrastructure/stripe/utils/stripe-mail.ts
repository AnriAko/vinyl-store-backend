export interface StripeMailTemplateParams {
    itemName?: string;
    quantity: number;
    totalCost: number;
    currency: string;
    receiptUrl?: string;
    succeeded: boolean;
    failureReason?: string;
}

export function generateStripeMailTemplate(params: StripeMailTemplateParams) {
    const {
        itemName,
        quantity,
        totalCost,
        currency,
        receiptUrl,
        succeeded,
        failureReason,
    } = params;

    const title = succeeded ? '✅ Purchase Successful' : '❌ Purchase Failed';

    const shortSummary = succeeded
        ? `You purchased ${quantity} × ${itemName || 'item'} for ${totalCost} ${currency.toUpperCase()}.`
        : `Your purchase for ${quantity} × ${itemName || 'item'} failed. ${
              failureReason ? `Reason: ${failureReason}` : ''
          }`;

    const baseContainer = `
        font-family: Arial, sans-serif;
        color: #333;
        width: 100%;
        max-width: 600px;
        min-width: 300px;
        padding: 20px;
        border-radius: 10px;
        background-color: ${succeeded ? '#fafafa' : '#fff5f5'};
        margin: 0 auto;
        box-sizing: border-box;
        word-wrap: break-word;
        overflow-wrap: break-word;
    `;

    const textStyle = `
        font-size: 15px;
        line-height: 1.5;
        color: #333;
    `;

    const button =
        receiptUrl && succeeded
            ? `
            <p style="text-align:center; margin-top:20px;">
                <a href="${receiptUrl}" style="display:inline-block; padding:10px 20px; background-color:#4CAF50; color:#fff; text-decoration:none; border-radius:5px; font-size:14px;">View Receipt</a>
            </p>
        `
            : '';

    const footer = `
        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">
        <p style="font-size:12px; color:#888; text-align:center;">Thank you for your purchase! - Vinyl Store</p>
    `;

    const html = `
        <!-- Text preview visible in Gmail before "Show more" -->
        <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
            ${shortSummary}
        </div>

        <div style="${baseContainer}">
            <h2 style="text-align:center; font-size:20px; color:${
                succeeded ? '#4CAF50' : '#f44336'
            };">${title}</h2>

            <p style="${textStyle}">
                ${shortSummary}
            </p>

            ${
                !succeeded && failureReason
                    ? `<p style="${textStyle}"><strong>Reason:</strong> ${failureReason}</p>`
                    : ''
            }

            ${button}
            ${footer}
        </div>
    `;

    return {
        subject: succeeded
            ? 'Your purchase was successful!'
            : 'Your purchase failed',
        text: shortSummary,
        html,
    };
}
