// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarDay } from "@/components/booking/CalendarDay";
import { BookingPage } from "@/components/booking/BookingPage";
import { parseLocalDate } from "@/lib/booking/calendar";

describe("CalendarDay", () => {
  it("calls onSelect for a free future day", () => {
    const onSelect = vi.fn();
    const date = parseLocalDate("2030-07-20");
    render(<CalendarDay date={date} intervals={[]} selected={false} rangeStart={false} rangeEnd={false} onSelect={onSelect} />);
    const button = screen.getByRole("button", { name: "2030-07-20, szabad" });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(date);
  });

  it("activates a free day with Enter and Space", () => {
    const onSelect = vi.fn();
    const date = parseLocalDate("2030-07-20");
    render(<CalendarDay date={date} intervals={[]} selected={false} rangeStart={false} rangeEnd={false} onSelect={onSelect} />);
    const button = screen.getByRole("button", { name: "2030-07-20, szabad" });
    button.focus();
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyDown(button, { key: " " });
    expect(onSelect).toHaveBeenNthCalledWith(1, date);
    expect(onSelect).toHaveBeenNthCalledWith(2, date);
  });

  it("does not call onSelect for a disabled past day", () => {
    const onSelect = vi.fn();
    render(<CalendarDay date={parseLocalDate("2020-01-01")} intervals={[]} selected={false} rangeStart={false} rangeEnd={false} onSelect={onSelect} />);
    const button = screen.getByRole("button", { name: /2020-01-01, múltbeli/ });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("BookingPage date selection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 6, 15, 14, 30));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ intervals: [{ start: "2026-07-18", end: "2026-07-20", type: "BOOKING" }] }) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("sets check-in, then check-out, and allows selection again after reset", async () => {
    render(<BookingPage />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "2026-07-21, szabad" }));
    expect(screen.getByText(/2026\. júl\. 21/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "2026-07-23, szabad" }));
    expect(screen.getByText(/2026\. júl\. 23/)).toBeInTheDocument();
    expect(screen.getByText("2 éjszaka")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dátumok visszaállítása" }));
    expect(screen.getAllByText("Nincs kiválasztva")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "2026-07-24, szabad" }));
    expect(screen.getByText(/2026\. júl\. 24/)).toBeInTheDocument();
  });

  it("treats today as selectable", async () => {
    render(<BookingPage />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const today = screen.getByRole("button", { name: "2026-07-15, szabad" });
    expect(today).not.toBeDisabled();
    fireEvent.click(today);
    expect(screen.getByText(/2026\. júl\. 15/)).toBeInTheDocument();
  });

  it("supports selection across month and year boundaries", async () => {
    vi.setSystemTime(new Date(2026, 11, 15, 14, 30));
    render(<BookingPage />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "2026-12-31, szabad" }));
    fireEvent.click(screen.getByRole("button", { name: "2027-01-02, szabad" }));
    expect(screen.getByText("2 éjszaka")).toBeInTheDocument();
  });

  it("allows check-in on a future booking departure boundary", async () => {
    render(<BookingPage />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const departure = await screen.findByRole("button", { name: "2026-07-20, csak érkezésre használható" });
    expect(departure).not.toBeDisabled();
    fireEvent.click(departure);
    expect(screen.getByText(/2026\. júl\. 20/)).toBeInTheDocument();
  });
});
