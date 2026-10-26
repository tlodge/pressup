/* How to do each exercise, and its easier and harder variations.
   Status: drafted from standard coaching practice and awaiting review by a qualified coach (see ROADMAP open questions).
   To add an exercise: add it to EXERCISES in exercises.ts, then give it an entry here. The guide test checks both. */

export type Guide = {
  steps: string[];
  cues: string[];
  easier?: string[];
  harder?: string[];
};

export const GUIDE_REVIEWED = false;

export const GUIDES: Record<string, Guide> = {
  "back-squat": {
    steps: ["Set the bar on your upper back, below the bony top of your neck, and step back from the rack.", "Stand with feet about shoulder-width apart, toes turned out slightly.", "Brace your stomach, then sit down and back until your hips are at least level with your knees.", "Drive through your whole foot to stand up, keeping your chest up."],
    cues: ["Knees track over your toes.", "Breathe in and brace before each rep."],
    easier: ["goblet-squat"], harder: ["front-squat"],
  },
  "front-squat": {
    steps: ["Rest the bar on the front of your shoulders, elbows high, fingertips under the bar.", "Stand with feet about shoulder-width apart.", "Squat straight down, keeping your elbows up and your torso upright.", "Stand up by driving through your whole foot."],
    cues: ["Elbows up the whole time.", "Use a lighter load than your back squat."],
    easier: ["goblet-squat", "back-squat"],
  },
  "goblet-squat": {
    steps: ["Hold a dumbbell or kettlebell against your chest with both hands.", "Stand with feet slightly wider than your hips.", "Sit down between your heels, keeping the weight close and your chest up.", "Push through your feet to stand."],
    cues: ["Elbows inside your knees at the bottom.", "Go as deep as you can while your back stays flat."],
    easier: ["bodyweight-squat"], harder: ["back-squat", "bulgarian-split-squat"],
  },
  "leg-press": {
    steps: ["Sit with your back flat against the pad and feet hip-width on the platform.", "Release the safety handles.", "Lower the platform until your knees are bent to about 90 degrees.", "Press back up without locking your knees straight."],
    cues: ["Keep your lower back on the pad.", "Push through your heels and mid-foot."],
    easier: ["bodyweight-squat"], harder: ["back-squat"],
  },
  "bodyweight-squat": {
    steps: ["Stand with feet shoulder-width apart, arms out in front for balance.", "Sit down and back as if onto a low chair.", "Go as low as is comfortable with your heels down.", "Stand back up, squeezing your glutes at the top."],
    cues: ["Weight through your whole foot.", "Use a chair to sit to if balance is hard."],
    harder: ["goblet-squat"],
  },
  deadlift: {
    steps: ["Stand with the bar over your mid-foot, feet hip-width apart.", "Hinge down and grip the bar just outside your legs.", "Flatten your back, pull your shoulders down and take the slack out of the bar.", "Push the floor away to stand up, keeping the bar against your legs, then lower it the same way."],
    cues: ["The bar stays close to your body.", "Hips and shoulders rise together."],
    easier: ["romanian-deadlift", "kettlebell-swing"],
  },
  "romanian-deadlift": {
    steps: ["Stand tall holding a barbell or dumbbells in front of your thighs.", "With soft knees, push your hips back and slide the weight down your legs.", "Stop when you feel a strong stretch in your hamstrings, usually just below the knee.", "Drive your hips forward to stand tall."],
    cues: ["Keep your back flat; the movement is at the hips.", "Weight stays close to your legs."],
    harder: ["single-leg-rdl", "deadlift"],
  },
  "kettlebell-swing": {
    steps: ["Stand with feet a little wider than your hips, kettlebell on the floor in front of you.", "Hinge to grip it and hike it back between your legs.", "Snap your hips forward to swing it to chest height.", "Let it fall back, hinging again to absorb it."],
    cues: ["Power comes from your hips, not your arms.", "Squeeze your glutes hard at the top."],
    easier: ["romanian-deadlift"],
  },
  "single-leg-rdl": {
    steps: ["Stand on one leg with a slight bend in the knee, weight in the opposite hand if using one.", "Hinge forward, letting your free leg extend behind you.", "Lower until your body is close to parallel with the floor or your hamstring is stretched.", "Return to standing with control. Finish all reps, then switch legs."],
    cues: ["Keep your hips square to the floor.", "Hold a wall lightly for balance if needed."],
    easier: ["romanian-deadlift"],
  },
  "bulgarian-split-squat": {
    steps: ["Stand a stride in front of a bench and rest the top of your back foot on it.", "Hold dumbbells by your sides if using them.", "Lower straight down until your back knee is just above the floor.", "Push through your front foot to stand. Finish the set, then switch legs."],
    cues: ["Most of your weight on the front foot.", "Lean your torso forward slightly for more glute work."],
    easier: ["reverse-lunge", "step-up"],
  },
  "walking-lunge": {
    steps: ["Stand tall, holding dumbbells by your sides if using them.", "Take a long step forward and lower until both knees are bent to about 90 degrees.", "Push through the front foot to bring your back leg through into the next step.", "Keep stepping, alternating legs."],
    cues: ["Front knee over your toes, not past them by much.", "Stay tall through your chest."],
    easier: ["reverse-lunge"], harder: ["bulgarian-split-squat"],
  },
  "reverse-lunge": {
    steps: ["Stand tall with feet hip-width apart.", "Step one foot back and lower until your back knee is just above the floor.", "Push through your front foot to return to standing.", "Alternate legs, or finish one side first."],
    cues: ["Stepping back is easier on the knees than stepping forward.", "Keep your front heel down."],
    easier: ["step-up"], harder: ["walking-lunge", "bulgarian-split-squat"],
  },
  "step-up": {
    steps: ["Stand facing a sturdy box or bench about knee height.", "Place one whole foot on the box.", "Drive through that foot to stand up on the box without pushing off the back leg.", "Step down with control. Finish the set, then switch legs."],
    cues: ["Lower box height if your knee caves in.", "Stand fully tall at the top."],
    harder: ["reverse-lunge", "bulgarian-split-squat"],
  },
  "hip-thrust": {
    steps: ["Sit with your upper back against a bench and a weight across your hips.", "Plant your feet flat, about hip-width apart.", "Drive your hips up until your body is straight from shoulders to knees.", "Pause, squeeze your glutes, then lower."],
    cues: ["Chin tucked, ribs down.", "Shins vertical at the top."],
    easier: ["glute-bridge"],
  },
  "glute-bridge": {
    steps: ["Lie on your back with knees bent and feet flat, hip-width apart.", "Press your lower back gently into the floor.", "Drive through your heels to lift your hips until your body is straight from shoulders to knees.", "Pause, then lower slowly."],
    cues: ["Squeeze your glutes, not your lower back.", "Keep your knees from falling in."],
    harder: ["hip-thrust"],
  },
  "leg-extension": {
    steps: ["Sit with your back against the pad and the roller on your lower shins.", "Line your knees up with the machine's pivot.", "Straighten your legs fully.", "Lower slowly to the start."],
    cues: ["Control the way down.", "Hold the handles to stay seated."],
  },
  "lying-leg-curl": {
    steps: ["Lie face down with the roller just above your heels.", "Hold the handles and keep your hips on the pad.", "Curl your heels towards your glutes.", "Lower slowly to straight."],
    cues: ["Don't let your hips lift.", "Slow on the way down."],
  },
  "standing-calf-raise": {
    steps: ["Stand on the edge of a step with your heels hanging off, holding a wall or rail.", "Lower your heels below the step for a stretch.", "Rise up as high as you can onto your toes.", "Pause at the top, then lower slowly."],
    cues: ["Full range, slow tempo.", "Hold a dumbbell to make it harder."],
  },
  "bench-press": {
    steps: ["Lie on the bench with eyes under the bar, feet flat on the floor.", "Grip the bar a little wider than shoulder-width and squeeze your shoulder blades together.", "Lower the bar to your lower chest with elbows at about 45 degrees to your body.", "Press up until your arms are straight."],
    cues: ["Use a spotter or safety arms for heavy sets.", "Bar path: lower chest to over the shoulders."],
    easier: ["dumbbell-bench-press", "push-up"],
  },
  "dumbbell-bench-press": {
    steps: ["Sit on a bench with dumbbells on your thighs, then lie back and bring them to chest level.", "Press them up over your chest.", "Lower until your elbows are just below the bench, at about 45 degrees to your body.", "Press back up."],
    cues: ["Shoulder blades pulled back and down.", "Lower with control."],
    easier: ["push-up", "machine-chest-press"], harder: ["bench-press"],
  },
  "incline-dumbbell-press": {
    steps: ["Set the bench to about 30 degrees and lie back with dumbbells at your chest.", "Press up and slightly back so the weights end over your shoulders.", "Lower to the sides of your upper chest.", "Press back up."],
    cues: ["Keep the incline low; steep angles become a shoulder press.", "Wrists stacked over elbows."],
    easier: ["dumbbell-bench-press"],
  },
  "machine-chest-press": {
    steps: ["Adjust the seat so the handles line up with your mid-chest.", "Sit back with your shoulder blades against the pad.", "Press the handles forward until your arms are straight.", "Return slowly until you feel a stretch across your chest."],
    cues: ["Keep your shoulders down, away from your ears.", "Don't let the weights crash."],
    harder: ["dumbbell-bench-press"],
  },
  "push-up": {
    steps: ["Start in a high plank with hands just wider than your shoulders.", "Keep a straight line from head to heels.", "Lower your chest towards the floor, elbows at about 45 degrees.", "Push back up to straight arms."],
    cues: ["Squeeze your glutes to stop your hips sagging.", "Chest leads, hips follow."],
    easier: ["incline-push-up", "knee-push-up"], harder: ["diamond-push-up", "dip"],
  },
  "incline-push-up": {
    steps: ["Put your hands on a bench, box, table edge or wall, a little wider than your shoulders.", "Walk your feet back until your body is in a straight line.", "Lower your chest to the edge.", "Push back up."],
    cues: ["The higher the surface, the easier it is.", "Lower the surface over the weeks to progress."],
    easier: ["knee-push-up"], harder: ["push-up"],
  },
  "knee-push-up": {
    steps: ["Start on your hands and knees, hands just wider than your shoulders.", "Walk your hands forward until your body is straight from head to knees.", "Lower your chest towards the floor.", "Push back up."],
    cues: ["Keep your hips in line; don't pike up.", "Move to incline push-ups once 15 reps feel easy."],
    harder: ["incline-push-up", "push-up"],
  },
  dip: {
    steps: ["Support yourself on parallel bars with straight arms.", "Lean slightly forward and lower by bending your elbows.", "Stop when your upper arms are about parallel with the floor.", "Press back up to straight arms."],
    cues: ["Stop if you feel a pinch at the front of the shoulder.", "Use a band under your knees for help."],
    easier: ["push-up"],
  },
  "overhead-press": {
    steps: ["Hold the bar at the front of your shoulders, hands just outside shoulder-width.", "Squeeze your glutes and brace your stomach.", "Press the bar straight up, moving your head back slightly to let it pass.", "Finish with the bar over your mid-foot, then lower to your shoulders."],
    cues: ["Don't lean back to finish the rep.", "Head through at the top."],
    easier: ["dumbbell-shoulder-press"],
  },
  "dumbbell-shoulder-press": {
    steps: ["Sit or stand holding dumbbells at shoulder height, palms forward or facing each other.", "Brace your stomach.", "Press the dumbbells overhead until your arms are straight.", "Lower back to shoulder height."],
    cues: ["Ribs down; don't arch your back.", "Seated with back support is easiest to learn."],
    harder: ["overhead-press"],
  },
  "pike-push-up": {
    steps: ["Start in a push-up position, then walk your feet in so your hips are high.", "Hands shoulder-width apart, head between your arms.", "Bend your elbows to lower the top of your head towards the floor.", "Press back up."],
    cues: ["The higher your hips, the harder it is.", "Elbows point back, not out."],
    easier: ["push-up"],
  },
  "barbell-row": {
    steps: ["Hold the bar with hands just wider than your knees.", "Hinge forward until your torso is at about 45 degrees, back flat.", "Pull the bar to your lower ribs, squeezing your shoulder blades together.", "Lower with control."],
    cues: ["Keep the hinge; don't stand up to finish the rep.", "Elbows drive back past your body."],
    easier: ["dumbbell-row"],
  },
  "dumbbell-row": {
    steps: ["Put one hand and knee on a bench, or one hand on a sturdy support.", "Hold a dumbbell in the other hand with your arm straight.", "Pull it towards your hip, elbow close to your side.", "Lower with control. Finish the set, then switch sides."],
    cues: ["Back flat and level.", "Think elbow to hip, not hand to shoulder."],
    harder: ["barbell-row"],
  },
  "seated-cable-row": {
    steps: ["Sit with feet on the platform, knees soft, holding the handle with straight arms.", "Sit tall.", "Pull the handle to your stomach, squeezing your shoulder blades together.", "Let your arms straighten slowly."],
    cues: ["Don't rock back to move the weight.", "Shoulders down, away from your ears."],
    easier: ["band-row"],
  },
  "inverted-row": {
    steps: ["Set a bar at about waist height and lie underneath it.", "Grip it just wider than shoulder-width, heels on the floor, body straight.", "Pull your chest to the bar.", "Lower until your arms are straight."],
    cues: ["Bend your knees to make it easier.", "Keep your body in one straight line."],
    easier: ["band-row"], harder: ["negative-pull-up", "pull-up"],
  },
  "band-row": {
    steps: ["Anchor a band at chest height, or loop it around your feet while sitting.", "Hold the ends with straight arms and step back until there's tension.", "Pull the handles to your stomach, squeezing your shoulder blades together.", "Return slowly."],
    cues: ["Control the band on the way back.", "Step further away for more resistance."],
    harder: ["inverted-row", "seated-cable-row"],
  },
  "pull-up": {
    steps: ["Hang from the bar with hands just wider than your shoulders, palms facing away.", "Pull your shoulders down and back.", "Pull until your chin is over the bar.", "Lower all the way to straight arms."],
    cues: ["No swinging; keep your legs still.", "Full hang at the bottom of every rep."],
    easier: ["band-assisted-pull-up", "negative-pull-up", "lat-pulldown"],
  },
  "band-assisted-pull-up": {
    steps: ["Loop a resistance band over the bar and put one knee or foot in it.", "Grip the bar just wider than your shoulders.", "Pull until your chin is over the bar.", "Lower slowly to straight arms."],
    cues: ["Use a lighter band as you get stronger.", "Same technique as a full pull-up."],
    easier: ["lat-pulldown", "inverted-row"], harder: ["negative-pull-up", "pull-up"],
  },
  "negative-pull-up": {
    steps: ["Use a box or jump to get your chin over the bar.", "Hold the top position for a second.", "Lower yourself as slowly as you can, aiming for 3 to 5 seconds.", "Step back up and repeat."],
    cues: ["The slow lowering builds the strength.", "Stop the set when you can no longer control the descent."],
    easier: ["band-assisted-pull-up", "inverted-row"], harder: ["pull-up"],
  },
  "lat-pulldown": {
    steps: ["Sit with your thighs under the pads and grip the bar just wider than your shoulders.", "Lean back slightly.", "Pull the bar to your upper chest, driving your elbows down.", "Let it rise slowly until your arms are straight."],
    cues: ["Don't pull behind your neck.", "Shoulders down before you pull."],
    easier: ["band-pulldown"], harder: ["band-assisted-pull-up", "pull-up"],
  },
  "band-pulldown": {
    steps: ["Anchor a band high, above head height.", "Kneel or sit facing it, arms straight up holding the band.", "Pull your elbows down to your sides.", "Return slowly."],
    cues: ["Squeeze your shoulder blades down and together.", "Move further from the anchor for more resistance."],
    harder: ["lat-pulldown", "band-assisted-pull-up"],
  },
  "lateral-raise": {
    steps: ["Stand holding light dumbbells by your sides.", "With a slight bend in your elbows, raise your arms out to the sides.", "Stop at shoulder height.", "Lower slowly."],
    cues: ["Lead with your elbows.", "Go light; this is a small muscle."],
  },
  "face-pull": {
    steps: ["Set a rope on a cable at head height, or anchor a band there.", "Hold it with palms facing in and step back.", "Pull towards your face, separating your hands and turning your thumbs back.", "Return slowly."],
    cues: ["Elbows high and wide.", "Finish like a double-biceps pose."],
  },
  "dumbbell-curl": {
    steps: ["Stand holding dumbbells by your sides, palms forward.", "Keep your elbows by your ribs.", "Curl the weights up towards your shoulders.", "Lower slowly to straight arms."],
    cues: ["No swinging from the back.", "Full stretch at the bottom."],
    easier: ["band-curl"],
  },
  "band-curl": {
    steps: ["Stand on the middle of a band, holding the ends with palms forward.", "Keep your elbows by your sides.", "Curl your hands towards your shoulders.", "Lower slowly."],
    cues: ["Widen your stance for more tension.", "Slow on the way down."],
    harder: ["dumbbell-curl"],
  },
  "chin-up": {
    steps: ["Hang from the bar with hands shoulder-width apart, palms facing you.", "Pull your shoulders down.", "Pull until your chin is over the bar.", "Lower all the way to straight arms."],
    cues: ["Chest towards the bar.", "No kipping."],
    easier: ["negative-pull-up", "band-assisted-pull-up"],
  },
  "cable-pushdown": {
    steps: ["Stand facing a high cable with a bar or rope attached.", "Pin your elbows to your sides with forearms about parallel to the floor.", "Push down until your arms are straight.", "Let your hands rise back slowly."],
    cues: ["Only your forearms move.", "Stand tall; don't lean over the weight."],
  },
  "overhead-triceps-extension": {
    steps: ["Hold one dumbbell overhead with both hands, or a band anchored low behind you.", "Keep your elbows pointing forward, close to your head.", "Lower the weight behind your head by bending your elbows.", "Straighten your arms to lift it back up."],
    cues: ["Ribs down; don't arch your back.", "Elbows stay still."],
  },
  "diamond-push-up": {
    steps: ["Start in a push-up position with hands close together under your chest, thumbs and index fingers touching.", "Keep your body straight.", "Lower your chest to your hands, elbows close to your sides.", "Push back up."],
    cues: ["Do them on your knees to make them easier.", "Elbows brush your ribs."],
    easier: ["push-up"],
  },
  plank: {
    steps: ["Rest on your forearms with elbows under your shoulders.", "Step your feet back so your body is straight from head to heels.", "Brace your stomach and squeeze your glutes.", "Hold for the time set, breathing steadily."],
    cues: ["Don't let your hips sag or pike.", "Drop to your knees if your form breaks."],
    harder: ["hollow-hold"],
  },
  "dead-bug": {
    steps: ["Lie on your back with arms pointing up and knees bent over your hips.", "Press your lower back into the floor.", "Slowly straighten one leg and lower the opposite arm towards the floor.", "Return and swap sides."],
    cues: ["Lower back stays down the whole time.", "Move slowly; breathe out as you extend."],
    harder: ["hollow-hold"],
  },
  "side-plank": {
    steps: ["Lie on your side with your elbow under your shoulder.", "Stack your feet, or bend your knees to make it easier.", "Lift your hips so your body is straight.", "Hold, then switch sides."],
    cues: ["Hips up and forward, not back.", "Keep your neck in line."],
  },
  "hanging-knee-raise": {
    steps: ["Hang from a bar with straight arms.", "Brace and stop yourself swinging.", "Raise your knees towards your chest, curling your pelvis up.", "Lower slowly."],
    cues: ["Avoid swinging to cheat the rep.", "Exhale as you lift."],
    easier: ["dead-bug"],
  },
  "hollow-hold": {
    steps: ["Lie on your back and press your lower back into the floor.", "Lift your shoulders and legs a few centimetres off the floor, arms by your ears.", "Hold the shape, keeping your lower back down.", "Bend your knees or bring your arms in to make it easier."],
    cues: ["Lower back pinned to the floor.", "Shorter holds with good form beat long ones."],
    easier: ["dead-bug", "plank"],
  },
};
