// Mock the global fetch API
// global.fetch = jest.fn(() =>
//   Promise.resolve({
//     ok: true,
//     json: () => Promise.resolve({}),
//   }),
// ) as jest.Mock;

// jest.mock("graphql-request", () => ({
//   request: jest.fn(),
//   gql: jest.fn(),
// }));

// Optionally, suppress console warnings/errors during tests
// jest.spyOn(console, "error").mockImplementation(() => {});
// jest.spyOn(console, "warn").mockImplementation(() => {});
