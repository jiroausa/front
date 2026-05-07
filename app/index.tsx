import React, { useState, useRef } from "react";
  import axios from "axios";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Keyboard,
  Switch,
  TouchableOpacity,
  ScrollView,
} from "react-native";




type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
};


type God = {
  name: string;
  description: string;
  parents?: string[];
  siblings?: string[];
  spouse?: string[];
  children?: string[];
};


type RelationType =
  | "wife"
  | "husband"
  | "brother"
  | "sister"
  | "parents"
  | "children";


type MythMode = "power" | "comparison" | "domain" | null;




const greekGods: Record<string, God> = {
  zeus: {
    name: "Zeus",
    description: "King of the gods, ruler of the sky, lightning, and thunder.",
    parents: ["Cronus", "Rhea"],
    siblings: ["Hera", "Poseidon", "Hades", "Demeter", "Hestia"],
    spouse: ["Hera"],
    children: ["Athena", "Ares", "Apollo", "Artemis", "Hermes", "Dionysus"],
  },
  hera: {
    name: "Hera",
    description: "Queen of the gods, goddess of marriage and family.",
    parents: ["Cronus", "Rhea"],
    siblings: ["Zeus", "Poseidon", "Hades", "Demeter", "Hestia"],
    spouse: ["Zeus"],
    children: ["Ares", "Hephaestus"],
  },
  poseidon: {
    name: "Poseidon",
    description: "God of the sea, earthquakes, storms, and horses.",
    parents: ["Cronus", "Rhea"],
    siblings: ["Zeus", "Hera", "Hades", "Demeter", "Hestia"],
    spouse: ["Amphitrite"],
    children: ["Triton"],
  },
  hades: {
    name: "Hades",
    description: "God of the underworld and the dead.",
    parents: ["Cronus", "Rhea"],
    siblings: ["Zeus", "Hera", "Poseidon", "Demeter", "Hestia"],
    spouse: ["Persephone"],
  },
  athena: {
    name: "Athena",
    description: "Goddess of wisdom, war strategy, and intelligence.",
    parents: ["Zeus"],
    siblings: ["Ares", "Apollo", "Artemis", "Hermes"],
  },
  aphrodite: {
    name: "Aphrodite",
    description: "Goddess of love, beauty, and desire.",
    parents: ["Zeus", "Dione"],
    siblings: ["Ares"],
    spouse: ["Hephaestus"],
  },
  ares: {
    name: "Ares",
    description: "God of war, violence, and battle chaos.",
    parents: ["Zeus", "Hera"],
    siblings: ["Athena", "Apollo", "Artemis", "Hermes"],
    spouse: ["Aphrodite"],
  },
  hephaestus: {
    name: "Hephaestus",
    description: "God of fire, metalworking, and blacksmiths.",
    parents: ["Zeus", "Hera"],
    siblings: ["Ares"],
    spouse: ["Aphrodite"],
  },
  apollo: {
    name: "Apollo",
    description: "God of music, light, prophecy, and healing.",
    parents: ["Zeus", "Leto"],
    siblings: ["Artemis"],
  },
  artemis: {
    name: "Artemis",
    description: "Goddess of the hunt, wilderness, and the moon.",
    parents: ["Zeus", "Leto"],
    siblings: ["Apollo"],
  },
  hermes: {
    name: "Hermes",
    description: "Messenger of the gods, god of travel, trade, and thieves.",
    parents: ["Zeus", "Maia"],
    siblings: ["Apollo", "Artemis", "Ares", "Athena"],
  },
  demeter: {
    name: "Demeter",
    description: "Goddess of agriculture, harvest, and fertility.",
    parents: ["Cronus", "Rhea"],
    siblings: ["Zeus", "Poseidon", "Hades", "Hera", "Hestia"],
    children: ["Persephone"],
  },
  persephone: {
    name: "Persephone",
    description: "Queen of the underworld, goddess of spring growth.",
    parents: ["Zeus", "Demeter"],
    spouse: ["Hades"],
  },
  dionysus: {
    name: "Dionysus",
    description: "God of wine, festivity, madness, and theatre.",
    parents: ["Zeus", "Semele"],
  },
  hestia: {
    name: "Hestia",
    description: "Goddess of the hearth, home, and family.",
    parents: ["Cronus", "Rhea"],
    siblings: ["Zeus", "Poseidon", "Hades", "Hera", "Demeter"],
  },
  rhea: {
    name: "Rhea",
    description: "Titaness and mother of the Olympian gods.",
    parents: [],
    siblings: ["Cronus"],
  },
  cronus: {
    name: "Cronus",
    description: "Leader of the Titans and father of the Olympian gods.",
    parents: [],
    children: ["Zeus", "Hera", "Poseidon", "Hades", "Demeter", "Hestia"],
  },
};




function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/2/g, "z")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/6/g, "g")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/9/g, "g")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}




function detectRelation(input: string): RelationType | null {
  const text = normalize(input);
  if (text.includes("wife")) return "wife";
  if (text.includes("husband")) return "husband";
  if (text.includes("brother")) return "brother";
  if (text.includes("sister")) return "sister";
  if (text.includes("parents")) return "parents";
  if (text.includes("children")) return "children";
  return null;
}


function detectMythMode(input: string): MythMode {
  const text = input.toLowerCase();
  if (text.includes("stronger") || text.includes("vs") || text.includes("versus"))
    return "comparison";
  if (text.includes("god of") || text.includes("what god of") || text.includes("is god of") || text.includes("god is"))
    return "domain";
  if (text.includes("power ranking") || text.includes("strongest") || text.includes("rank gods"))
    return "power";
  return null;
}




function findGodFromWord(word: string): string | null {
  let best: string | null = null;
  let bestScore = Infinity;
  for (const key in greekGods) {
    const distance = levenshtein(word, key);
    if (distance < bestScore) {
      bestScore = distance;
      best = key;
    }
    if (distance <= 2) return key;
  }
  return bestScore <= 2 ? best : null;
}


function findClosestGod(input: string): string | null {
  const cleaned = normalize(input).replace(/ /g, "");
  let best: string | null = null;
  let bestScore = Infinity;
  for (const key in greekGods) {
    const distance = levenshtein(cleaned, key);
    const threshold = key.length <= 4 ? 2 : key.length <= 7 ? 3 : 4;
    const overlap = cleaned.split("").filter((c) => key.includes(c)).length;
    const score = distance - overlap * 0.5;
    if (score < bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return bestScore <= 4 ? best : null;
}


function extractGod(input: string): string | null {
  const cleaned = normalize(input);
  const words = cleaned.split(" ");
  for (const w of words) if (greekGods[w]) return w;
  for (const w of words) {
    const m = findGodFromWord(w);
    if (m) return m;
  }
  return findClosestGod(cleaned);
}




function getPowerRank(godKey: string): number {
  const rank: Record<string, number> = {
    zeus: 10,
    cronus: 10,
    poseidon: 9,
    hades: 9,
    rhea: 9,
    hera: 8,
    athena: 8,
    demeter: 7,
    apollo: 7,
    artemis: 7,
    ares: 7,
    persephone: 7,
    hermes: 6,
    aphrodite: 6,
    hephaestus: 6,
    dionysus: 6,
    hestia: 5,
  };
  return rank[godKey] || 5;
}


function getPowerRanking(): string {
  return Object.keys(greekGods)
    .sort((a, b) => getPowerRank(b) - getPowerRank(a))
    .map((k, i) => `${i + 1}. ${greekGods[k].name} (Power ${getPowerRank(k)})`)
    .join("\n");
}


function compareGods(a: string, b: string): string {
  const aRank = getPowerRank(a);
  const bRank = getPowerRank(b);
  if (aRank > bRank) return `⚔️ ${greekGods[a].name} is stronger than ${greekGods[b].name}`;
  if (bRank > aRank) return `⚔️ ${greekGods[b].name} is stronger than ${greekGods[a].name}`;
  return `⚔️ ${greekGods[a].name} and ${greekGods[b].name} are equally powerful`;
}




function formatWikipediaStyle(god: God): string {
  return (
    `🏛️ ${god.name}\n\n` +
    `${god.name} is a major deity in Greek mythology. ${god.description}\n\n` +
    `${god.name} belongs to the Olympian pantheon.`
  );
}




function getGodInfo(input: string): string {
  const relation = detectRelation(input);
  const mode = detectMythMode(input);
  const godKey = extractGod(input);
  const cleaned = normalize(input);


  if (mode === "power") return "🔥 GOD POWER RANKING:\n\n" + getPowerRanking();
  if (mode === "comparison") {
    const gods = cleaned.split(" ").map(findGodFromWord).filter(Boolean) as string[];
    if (gods.length >= 2) return compareGods(gods[0], gods[1]);
    return "⚠️ Please mention two gods to compare (e.g. Zeus vs Hades)";
  }
  if (mode === "domain" && godKey)
    return `⚡ ${greekGods[godKey].name} is associated with: ${greekGods[godKey].description}`;
  if (!godKey) return "❌ God not found.";


  const god = greekGods[godKey];
  if (relation === "wife" || relation === "husband")
    return `💍 ${god.name}'s spouse: ${god.spouse?.join(", ") || "Unknown"}`;
  if (relation === "brother" || relation === "sister")
    return `👥 ${god.name}'s siblings: ${god.siblings?.join(", ") || "Unknown"}`;
  if (relation === "parents")
    return `👨‍👩‍👧 ${god.name}'s parents: ${god.parents?.join(", ") || "Unknown"}`;
  if (relation === "children")
    return `👶 ${god.name}'s children: ${god.children?.join(", ") || "Unknown"}`;
  return formatWikipediaStyle(god);
}




export default function HomeScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);




const sendMessage = async (customText?: string) => {
  const textToSend = customText || input;
  if (!textToSend.trim()) return;


  const userMsg: Message = {
    id: Date.now().toString(),
    text: textToSend,
    sender: "user",
  };


  setMessages((prev) => [...prev, userMsg]);
  setInput("");
  Keyboard.dismiss();


  try {
    const res = await axios.post("http://localhost:8000/ask", {
      message: textToSend,
    });


    const botMsg: Message = {
      id: Date.now().toString() + "_b",
      text: res.data.response,
      sender: "bot",
    };


    setMessages((prev) => [...prev, botMsg]);
  } catch (err) {
    const botError: Message = {
      id: Date.now().toString() + "_err",
      text: "⚠️ Cannot connect to server",
      sender: "bot",
    };


    setMessages((prev) => [...prev, botError]);
  }
};


  const quickActions = [
    "Who is Zeus?",
    "Who is Hades' wife?",
    "Zeus vs Poseidon",
    "Show power ranking",
    "What is Apollo god of?",
  ];


  return (
    <View style={[styles.container, { backgroundColor: darkMode ? "#121212" : "#f2f2f2" }]}>
      <Text style={[styles.header, { color: darkMode ? "#fff" : "#000" }]}>🏛️ AskGreekGodsBot</Text>
      <View style={styles.darkToggle}>
        <Text>{darkMode ? "🌙" : "☀️"}</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>


      {/* FIXED Quick Actions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickContainer}>
        {quickActions.map((q) => (
          <TouchableOpacity
            key={q}
            style={[styles.quickButton, { backgroundColor: darkMode ? "#333" : "#ffe082" }]}
            onPress={() => sendMessage(q)}
          >
            <Text style={[styles.quickText, { color: darkMode ? "#fff" : "#000" }]}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>


      {}
      <View style={styles.chatContainer}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={[styles.message, item.sender === "user" ? styles.user : styles.bot]}>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          )}
        />
      </View>


      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Ask about any god..."
        placeholderTextColor={darkMode ? "#aaa" : "#555"}
        style={[
          styles.input,
          {
            backgroundColor: darkMode ? "#1e1e1e" : "#fff",
            color: darkMode ? "#fff" : "#000",
          },
        ]}
        onSubmitEditing={() => sendMessage()}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 1,
    fontFamily: "serif",
    textShadowColor: "#d4af37",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  darkToggle: {
    position: "absolute",
    top: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
  },
  quickContainer: {
    flexGrow: 0,
    marginBottom: 10,
  },
  quickButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#d4af37",
  },
  quickText: {
    fontSize: 14,
    fontFamily: "serif",
  },
  chatContainer: {
    flex: 1,
  },
  message: {
    padding: 14,
    borderRadius: 15,
    marginVertical: 6,
    maxWidth: "80%",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 2 },
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#f9e79f",
  },
  bot: {
    alignSelf: "flex-start",
    backgroundColor: "#f7dc6f",
  },
  text: {
    fontSize: 16,
    fontFamily: "serif",
  },
  input: {
    borderWidth: 2,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    fontFamily: "serif",
    marginTop: 10,
  },
});
