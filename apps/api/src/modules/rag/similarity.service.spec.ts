import { SimilarityService } from "./similarity.service";

describe("SimilarityService", () => {
  const service = new SimilarityService();

  it("returns cosine similarity for equal vectors", () => {
    expect(service.cosineSimilarity([1, 0, 1], [1, 0, 1])).toBeCloseTo(1);
  });

  it("returns zero for empty or mismatched vectors", () => {
    expect(service.cosineSimilarity([], [1, 2])).toBe(0);
    expect(service.cosineSimilarity([1], [1, 2])).toBe(0);
  });
});
