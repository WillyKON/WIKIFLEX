const CINETPAY_CHECKOUT_URL = "https://api-checkout.cinetpay.com/v2/payment";
const CINETPAY_CHECK_URL = "https://api-checkout.cinetpay.com/v2/payment/check";

export type CinetPayInitInput = {
  transactionId: string;
  amountFcfa: number;
  customerName: string;
  customerEmail: string;
  description: string;
  returnUrl: string;
  notifyUrl: string;
};

export type CinetPayInitResult = {
  paymentToken: string;
  paymentUrl: string;
};

export function cinetpayConfigured(): boolean {
  return Boolean(
    process.env.CINETPAY_API_KEY &&
      process.env.CINETPAY_SITE_ID &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function initCinetPayPayment(
  input: CinetPayInitInput,
): Promise<CinetPayInitResult> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;

  if (!apiKey || !siteId) {
    throw new Error(
      "CinetPay n'est pas configuré (CINETPAY_API_KEY, CINETPAY_SITE_ID)",
    );
  }

  const response = await fetch(CINETPAY_CHECKOUT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: input.transactionId,
      amount: input.amountFcfa,
      currency: "XOF",
      description: input.description,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      notify_url: input.notifyUrl,
      return_url: input.returnUrl,
      channels: "MOBILE_MONEY",
      lang: "fr",
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    code: string;
    message: string;
    data?: { payment_token?: string; payment_url?: string };
  };

  if (payload.code !== "00" || !payload.data?.payment_url) {
    throw new Error(
      `Initialisation CinetPay refusée : ${payload.code} ${payload.message}`,
    );
  }

  return {
    paymentToken: payload.data.payment_token ?? "",
    paymentUrl: payload.data.payment_url,
  };
}

export type CinetPayCheckResult = {
  status: string;
  amount: number;
  transactionId: string;
  paymentMethod: string | null;
};

export async function verifyCinetPayTransaction(
  transactionId: string,
): Promise<CinetPayCheckResult> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;

  if (!apiKey || !siteId) {
    throw new Error("CinetPay n'est pas configuré");
  }

  const response = await fetch(CINETPAY_CHECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    code: string;
    message: string;
    data?: {
      status?: string;
      amount?: string | number;
      transaction_id?: string;
      payment_method?: string;
    };
  };

  if (payload.code !== "00" || !payload.data?.status) {
    throw new Error(
      `Vérification CinetPay impossible : ${payload.code} ${payload.message}`,
    );
  }

  return {
    status: payload.data.status,
    amount: Number(payload.data.amount ?? 0),
    transactionId: payload.data.transaction_id ?? transactionId,
    paymentMethod: payload.data.payment_method ?? null,
  };
}
