import type { Result } from "./result.ts";

/**
 * TEST DATA — two hand-written answers, used only by lib/result.test.ts to check
 * `isResult` against something realistic. Nothing in the app imports this file:
 * the interface shows no pre-written content, only what the person types and,
 * once the AI step exists, what it returns.
 *
 * No React and no "@/" imports, so the test runner can load it.
 */

export type Fixture = { title: string; command: string; result: Result };

export const FIXTURES: readonly Fixture[] = [
  {
    title: "Booking app",
    command: "A yoga studio wants customers to book classes, cancel up to 12 hours before, and get a reminder.",
    result: {
      title: "Yoga studio booking",
      summary: "Customers book and cancel classes online and get a reminder; the studio sees who is coming to each class.",
      stories: [
        {
          id: "US-01", priority: "Must", role: "customer", action: "see the weekly class schedule",
          benefit: "I can choose a class that fits my day",
          criteria: [
            "Classes are listed by day with time, teacher and free places",
            "A full class is marked as full and cannot be booked",
            "The schedule opens in under two seconds on a phone",
          ],
        },
        {
          id: "US-02", priority: "Must", role: "customer", action: "book a place in a class",
          benefit: "I am sure I have a spot",
          criteria: [
            "The booking is confirmed on screen straight away",
            "The number of free places drops by one",
            "The same customer cannot book the same class twice",
          ],
        },
        {
          id: "US-03", priority: "Must", role: "customer", action: "cancel my booking up to 12 hours before the class",
          benefit: "I can free my place without calling the studio",
          criteria: [
            "Cancel is available until 12 hours before the start",
            "Inside 12 hours the button is replaced by the rule in plain words",
            "A cancelled place is free for others immediately",
          ],
        },
        {
          id: "US-04", priority: "Should", role: "customer", action: "get a reminder before my class",
          benefit: "I do not forget to come",
          criteria: [
            "The reminder is sent three hours before the start",
            "It names the class, the time and the teacher",
            "I can switch reminders off",
          ],
        },
        {
          id: "US-05", priority: "Should", role: "studio owner", action: "see who is booked for each class",
          benefit: "I can prepare the room and brief the teacher",
          criteria: [
            "Each class shows the names of the people booked",
            "The list updates on every booking and cancellation",
            "The list can be printed",
          ],
        },
        {
          id: "US-06", priority: "Could", role: "customer", action: "join a waiting list for a full class",
          benefit: "I get the place if someone cancels",
          criteria: [
            "A waiting list is offered on every full class",
            "The first person in line is told when a place opens",
            "The offer expires after two hours and moves to the next person",
          ],
        },
      ],
      roadmap: [
        { name: "Now", goal: "Customers can find a class and book it", stories: ["US-01", "US-02"] },
        { name: "Next", goal: "Plans can change without a phone call", stories: ["US-03", "US-04"] },
        { name: "Later", goal: "The studio runs its day from the app", stories: ["US-05", "US-06"] },
      ],
    },
  },
  {
    title: "Internal tool",
    command: "Our support team needs one screen that shows a customer's open tickets, orders and last three emails.",
    result: {
      title: "Customer overview for support",
      summary: "One screen for the support team with a customer's tickets, orders and recent emails, so nobody switches between three systems.",
      stories: [
        {
          id: "US-01", priority: "Must", role: "support agent", action: "find a customer by name, email or order number",
          benefit: "I reach their record in seconds",
          criteria: [
            "Results appear while I type",
            "Each result shows name, email and the date of the last contact",
            "When nothing matches, a clear message says so",
          ],
        },
        {
          id: "US-02", priority: "Must", role: "support agent", action: "see the customer's open tickets",
          benefit: "I know what is still unresolved",
          criteria: [
            "Open tickets are listed newest first",
            "Each ticket shows status, subject and age",
            "Clicking a ticket opens it",
          ],
        },
        {
          id: "US-03", priority: "Must", role: "support agent", action: "see the customer's recent orders",
          benefit: "I can answer questions about delivery and payment",
          criteria: [
            "The last ten orders show date, total and status",
            "An order opens with its full detail",
            "Refunded orders are clearly marked",
          ],
        },
        {
          id: "US-04", priority: "Should", role: "support agent", action: "read the last three emails with the customer",
          benefit: "I can continue the conversation without searching the inbox",
          criteria: [
            "Each email shows sender, date and its first lines",
            "Opening an email shows the full text",
            "Emails are read-only on this screen",
          ],
        },
        {
          id: "US-05", priority: "Could", role: "team lead", action: "see how long customers wait for a first reply",
          benefit: "I can spot overloaded days",
          criteria: [
            "The average first-reply time is shown per day",
            "Days over the target are highlighted",
            "The view can be filtered by week",
          ],
        },
      ],
      roadmap: [
        { name: "Now", goal: "Agents find the customer and see their open tickets", stories: ["US-01", "US-02"] },
        { name: "Next", goal: "Agents answer from a single screen", stories: ["US-03", "US-04"] },
        { name: "Later", goal: "The team steers the workload", stories: ["US-05"] },
      ],
    },
  },
];
