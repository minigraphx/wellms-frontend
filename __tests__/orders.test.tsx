import { orderStatusOf } from "../app/i18n/messages/shop";
import { messages } from "../app/i18n/messages";

describe("order status", () => {
  it("maps API names and numbers to a status", () => {
    expect(orderStatusOf("paid")).toBe("paid");
    expect(orderStatusOf("PAID")).toBe("paid");
    expect(orderStatusOf(1)).toBe("paid");
    expect(orderStatusOf("cancelled")).toBe("cancelled");
    expect(orderStatusOf(3)).toBe("cancelled");
    expect(orderStatusOf("processing")).toBe("pending");
    expect(orderStatusOf(0)).toBe("pending");
  });

  it("has a label for each status in German and English", () => {
    expect(messages.de.shop.orderStatus[orderStatusOf(1)]).toBe("Bezahlt");
    expect(messages.de.shop.orderStatus[orderStatusOf(3)]).toBe("Storniert");
    expect(messages.de.shop.orderStatus[orderStatusOf("new")]).toBe("Ausstehend");
    expect(messages.en.shop.orderStatus[orderStatusOf(1)]).toBe("Paid");
    expect(messages.en.shop.orderStatus[orderStatusOf(3)]).toBe("Cancelled");
    expect(messages.en.shop.orderStatus[orderStatusOf("new")]).toBe("Pending");
  });
});
