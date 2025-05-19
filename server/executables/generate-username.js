const { sql } = require("../database/neon");

const adjectives = [
    "silent", "crazy", "witty", "bouncy", "electric", "shiny", "cosmic", "nervous", "sleepy", "sneaky"
  ];
  const nouns = [
    "panda", "banana", "otter", "wizard", "sloth", "taco", "yeti", "toaster", "pirate", "llama"
  ];

  const generateFunUsernames = () => {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];    

    const randomNumber = Math.floor(Math.random() * 1000);
    return `${adj}${noun}${randomNumber}`;
};

async function fillEmptyUsernames() {
    try {
        const usersWithoutUsername = await sql`SELECT id FROM users WHERE username is NULL OR username = ''`
        console.log(`Found ${usersWithoutUsername.length} users without a username.`);

        for(const user of usersWithoutUsername) {
            let username;
            let isUnique = false;

            while (!isUnique) {
                username = generateFunUsernames();
                const check =
                  await sql`SELECT 1 FROM users WHERE username = ${username}`;
                isUnique = check.length === 0;
            };
            await sql`UPDATE users SET username = ${username} WHERE id = ${user.id}`;
            console.log(`Updated user with ID ${user.id} to username: ${username}`);
        }

        console.log("🎉 All fun usernames assigned!");        
    } catch (err) {
        console.error("❌ Error updating usernames:", err);
    }
}

fillEmptyUsernames();