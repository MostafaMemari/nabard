export async function mockDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
}
