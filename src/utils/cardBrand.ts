/**
 * Detect card brand from card number (digits only).
 * Does not validate length or Luhn; only identifies brand from IIN.
 */
export type CardBrand = "Visa" | "Mastercard" | "Discover" | "American Express";

export function getCardBrand(cardNumber: string): CardBrand | undefined {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 4) return undefined;
  const n2 = digits.slice(0, 2);
  const n3 = digits.slice(0, 3);
  const n4 = digits.slice(0, 4);
  const n6 = digits.length >= 6 ? digits.slice(0, 6) : "";
  if (digits.startsWith("4")) return "Visa";
  if (digits.startsWith("34") || digits.startsWith("37")) return "American Express";
  if (n2 >= "51" && n2 <= "55") return "Mastercard";
  if (n6 >= "222100" && n6 <= "272099") return "Mastercard";
  if (n4 === "6011") return "Discover";
  if (n3 >= "644" && n3 <= "649") return "Discover";
  if (n6 >= "622126" && n6 <= "622925") return "Discover";
  if (n6 >= "624000" && n6 <= "626999") return "Discover";
  if (n6 >= "628200" && n6 <= "628899") return "Discover";
  if (n2 === "65") return "Discover";
  return undefined;
}

export function getLastFour(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  return digits.slice(-4);
}
