import { describe, expect, it } from "vitest";
import { bookingRequestAdminTemplate, bookingRequestGuestTemplate, type BookingEmailData } from "@/lib/email/templates";
import { EmailConfigurationError, getEmailConfig } from "@/lib/email/config";

const data: BookingEmailData = {
  publicReference: "FG-2030-ABC123", guestName: "Teszt <script>alert(1)</script>", guestEmail: "guest@example.test",
  guestPhone: "+36301234567", checkInDate: "2030-08-10", checkOutDate: "2030-08-13", nights: 3,
  adultCount: 2, childAges: [8], notes: "<b>csendes</b>", createdAt: new Date("2030-01-01T10:00:00Z"),
  price: { accommodationSubtotal: 102000, extraAdultFee: 0, childrenFee: 9000, cleaningFee: 15000, tourismTax: 0, discount: 0, total: 126000, currency: "HUF" },
  appName: "Demo Apartman", contactEmail: "contact@example.test",
};

describe("booking email templates", () => {
  it("renders the guest reference, dates, price breakdown and non-final warning", () => {
    const template = bookingRequestGuestTemplate(data);
    expect(template.text).toContain("FG-2030-ABC123");
    expect(template.text).toContain("2030-08-10");
    expect(template.text).toContain("2030-08-13");
    expect(template.text).toContain("Összesen");
    expect(template.text).toContain("nem végleges");
    expect(template.text.length).toBeGreaterThan(0);
    expect(template.html).toContain("&lt;script&gt;");
    expect(template.html).not.toContain("<script>");
  });

  it("renders required admin details without internal database identifiers", () => {
    const template = bookingRequestAdminTemplate(data);
    expect(template.text).toContain("guest@example.test");
    expect(template.text).toContain("+36301234567");
    expect(template.text).toContain("8");
    expect(template.html).toContain("&lt;b&gt;csendes&lt;/b&gt;");
    expect(`${template.text}${template.html}`).not.toContain("bookingId");
  });
});

describe("email configuration", () => {
  it("fails safely when production notification configuration is missing", () => {
    expect(() => getEmailConfig({ NODE_ENV: "production" })).toThrow(EmailConfigurationError);
  });
});
