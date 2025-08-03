import React from "react";
import {render, screen, fireEvent} from "@testing-library/react";
import {vi} from "vitest";
import {ProtocolStatsErrorBoundary} from "../ProtocolStatsErrorBoundary";

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing
function ThrowError({shouldThrow}: {shouldThrow: boolean}) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div data-testid="success">No error</div>;
}

describe("ProtocolStatsErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ProtocolStatsErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ProtocolStatsErrorBoundary>
    );

    expect(screen.getByTestId("success")).toBeTruthy();
  });

  it("renders error fallback when child component throws", () => {
    render(
      <ProtocolStatsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ProtocolStatsErrorBoundary>
    );

    expect(screen.getByText("Failed to load protocol statistics")).toBeTruthy();
    expect(screen.getByText("Test error")).toBeTruthy();
  });

  it("calls onError callback when error occurs", () => {
    const onError = vi.fn();

    render(
      <ProtocolStatsErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ProtocolStatsErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("allows retry functionality", () => {
    let shouldThrow = true;

    function RetryableComponent() {
      return <ThrowError shouldThrow={shouldThrow} />;
    }

    const {rerender} = render(
      <ProtocolStatsErrorBoundary>
        <RetryableComponent />
      </ProtocolStatsErrorBoundary>
    );

    // Should show error initially
    expect(screen.getByText("Failed to load protocol statistics")).toBeTruthy();

    // Change the error condition
    shouldThrow = false;

    // Click retry button
    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);

    // Re-render with new props
    rerender(
      <ProtocolStatsErrorBoundary>
        <RetryableComponent />
      </ProtocolStatsErrorBoundary>
    );

    // Should show success after retry
    expect(screen.getByTestId("success")).toBeTruthy();
  });

  it("uses custom fallback component when provided", () => {
    function CustomFallback({
      error,
      onRetry,
    }: {
      error?: Error;
      onRetry?: () => void;
    }) {
      return (
        <div>
          <div data-testid="custom-error">Custom error: {error?.message}</div>
          <button onClick={onRetry}>Custom Retry</button>
        </div>
      );
    }

    render(
      <ProtocolStatsErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ProtocolStatsErrorBoundary>
    );

    expect(screen.getByTestId("custom-error")).toBeTruthy();
    expect(screen.getByText("Custom error: Test error")).toBeTruthy();
    expect(screen.getByText("Custom Retry")).toBeTruthy();
  });

  it("logs error to console", () => {
    render(
      <ProtocolStatsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ProtocolStatsErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      "ProtocolStats Error Boundary caught an error:",
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });
});
