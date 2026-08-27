const fs = require('fs');

// Update implementation_plan.md
const planPath = '/home/som2077/.gemini/antigravity/brain/34ecfdd4-9312-40f2-812e-549e57f9b36c/implementation_plan.md';
let plan = fs.readFileSync(planPath, 'utf8');

const newTool = `
4. \`schedule_outfit_event(date, time, occasion, outfit_item_ids)\`
   - *AI uses this when:* The user says "Plan this for Monday" or "Schedule this outfit".
   - *Returns:* Success confirmation. The frontend will automatically insert this into the \`planned_events\` database table and the user's local calendar store.
`;

plan = plan.replace('3. `search_affiliate_products(query, gender, budget)`\n   - *AI uses this when:* The user is missing a crucial item (e.g., "You don\'t have a black blazer, but here are 3 great options you can buy").\n   - *Returns:* Product names, prices, affiliate URLs, and image URLs.', 
  '3. `search_affiliate_products(query, gender, budget)`\n   - *AI uses this when:* The user is missing a crucial item (e.g., "You don\'t have a black blazer, but here are 3 great options you can buy").\n   - *Returns:* Product names, prices, affiliate URLs, and image URLs.' + newTool);

const newUI = `
- **Calendar/Planner UI:** When the AI successfully schedules an outfit, it returns \`"ui_type": "calendar_confirmation"\`, which renders a sleek "✅ Scheduled for Monday, 4 PM" card with a button to view the calendar.
`;

plan = plan.replace('the actual images of the clothes from the user\'s wardrobe.', 'the actual images of the clothes from the user\'s wardrobe.' + newUI);

fs.writeFileSync(planPath, plan);

// Update task.md
const taskPath = '/home/som2077/.gemini/antigravity/brain/34ecfdd4-9312-40f2-812e-549e57f9b36c/task.md';
let task = fs.readFileSync(taskPath, 'utf8');

const newTask = `
- \`[ ]\` **Phase 5: Calendar / Planner Integration**
  - \`[ ]\` Add \`schedule_outfit_event\` tool to \`useStylistChat.ts\` tools array.
  - \`[ ]\` Inject current date/day into the \`SYSTEM_PROMPT\` (so AI knows when "Monday" is).
  - \`[ ]\` Implement tool execution: Insert data into Supabase \`planned_events\` table.
  - \`[ ]\` Build \`<ScheduledEventCard />\` UI component.
  - \`[ ]\` Render the card in \`stylist-chat.tsx\` when the AI schedules an event.
`;

task = task + newTask;
fs.writeFileSync(taskPath, task);
