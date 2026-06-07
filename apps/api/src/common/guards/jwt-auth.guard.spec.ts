import { UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const jwt = {
    verifyAsync: jest.fn(),
  };
  const config = {
    getOrThrow: jest.fn(() => "access-secret"),
  };
  const guard = new JwtAuthGuard(jwt as never, config as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("attaches verified JWT payloads to the request", async () => {
    jwt.verifyAsync.mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
      email: "ada@example.com",
    });
    const request = requestWithAuth("Bearer token");

    await expect(guard.canActivate(contextFor(request) as never)).resolves.toBe(true);
    expect(request.user).toEqual(expect.objectContaining({ userId: "user-1" }));
  });

  it("rejects missing bearer tokens", async () => {
    await expect(guard.canActivate(contextFor(requestWithAuth()) as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

function requestWithAuth(authorization?: string) {
  return {
    user: undefined,
    header: jest.fn((name: string) => (name === "Authorization" ? authorization : undefined)),
  };
}

function contextFor(request: ReturnType<typeof requestWithAuth>) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };
}
