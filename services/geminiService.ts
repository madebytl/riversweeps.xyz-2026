// Mock Service - No API Key needed for simulator mode

export const generatePitBossResponse = async (
  history: { role: string; text: string }[],
  playerAction: string,
  currentBalance: number
): Promise<string> => {
  // Simulate network latency for realism
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));

  const lowerInput = playerAction.toLowerCase();
  
  // Cheat handling fallback
  if (lowerInput.includes('cheat')) return "I didn't see anything... 😉";

  // Context-aware simulated responses
  if (lowerInput.includes('hello') || lowerInput.includes('hi')) return "Welcome back to the floor! Ready to win big?";
  if (lowerInput.includes('bonus')) return "Keep spinning! The big bonus is just around the corner.";
  if (lowerInput.includes('jackpot')) return "The Grand Jackpot is getting heavy! Someone's gonna drop it soon.";
  if (lowerInput.includes('lose') || lowerInput.includes('lost')) return "Bad luck passes, skill remains. Shake it off!";
  if (lowerInput.includes('win') || lowerInput.includes('won')) return "That's what I'm talking about! 🚀";
  if (lowerInput.includes('news')) return "I heard the Crypto Whales are migrating today. Might be a sign.";
  if (lowerInput.includes('help')) return "Just tap the buttons and pray to the Kirin. It's easy!";

  const randomResponses = [
      "The energy in here is electric tonight! ⚡",
      `Looking at that balance... ${currentBalance.toLocaleString()} coins is a solid war chest.`,
      "Trust your gut. The Game Vault watches.",
      "Spin it to win it!",
      "I've got a good feeling about this next round.",
      "Remember: Scared money makes no money! 💸",
      "I've seen players turn 10 coins into a fortune. Why not you?",
      "Stay sharp, the Boss Fish is lurking."
  ];

  return randomResponses[Math.floor(Math.random() * randomResponses.length)];
};

export const generateCasinoImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string | null> => {
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return a high-quality random image from a placeholder service to simulate generation
    // Using a random seed based on time to ensure variety
    const seed = Date.now();
    return `https://picsum.photos/1024/1024?random=${seed}`;
};

export const editCasinoImage = async (base64Image: string, prompt: string): Promise<string | null> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Return a different random image to simulate a successful edit
    const seed = Date.now() + 1;
    return `https://picsum.photos/1024/1024?grayscale&random=${seed}`;
};