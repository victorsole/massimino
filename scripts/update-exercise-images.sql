-- Update Exercise Images SQL
-- Generated from free-exercise-db import
-- Run this in your database to add image URLs to exercises

-- Chest
UPDATE exercises SET "imageUrl" = '/exercises/barbell-bench-press/0.jpg' WHERE LOWER(name) LIKE '%barbell bench press%' OR LOWER(name) = 'bench press';
UPDATE exercises SET "imageUrl" = '/exercises/incline-barbell-bench-press/0.jpg' WHERE LOWER(name) LIKE '%incline barbell bench%' OR LOWER(name) = 'incline bench press';
UPDATE exercises SET "imageUrl" = '/exercises/decline-barbell-bench-press/0.jpg' WHERE LOWER(name) LIKE '%decline barbell bench%' OR LOWER(name) = 'decline bench press';
UPDATE exercises SET "imageUrl" = '/exercises/dumbbell-bench-press/0.jpg' WHERE LOWER(name) LIKE '%dumbbell bench press%' OR LOWER(name) LIKE '%flat dumbbell press%';
UPDATE exercises SET "imageUrl" = '/exercises/incline-dumbbell-press/0.jpg' WHERE LOWER(name) LIKE '%incline dumbbell%press%';
UPDATE exercises SET "imageUrl" = '/exercises/decline-dumbbell-press/0.jpg' WHERE LOWER(name) LIKE '%decline dumbbell%press%';
UPDATE exercises SET "imageUrl" = '/exercises/close-grip-bench-press/0.jpg' WHERE LOWER(name) LIKE '%close grip bench%' OR LOWER(name) LIKE '%close-grip bench%';
UPDATE exercises SET "imageUrl" = '/exercises/dumbbell-flye/0.jpg' WHERE LOWER(name) LIKE '%dumbbell fl%' AND LOWER(name) NOT LIKE '%incline%';
UPDATE exercises SET "imageUrl" = '/exercises/incline-dumbbell-flye/0.jpg' WHERE LOWER(name) LIKE '%incline dumbbell fl%';
UPDATE exercises SET "imageUrl" = '/exercises/cable-crossover/0.jpg' WHERE LOWER(name) LIKE '%cable crossover%' OR LOWER(name) LIKE '%cable fly%';
UPDATE exercises SET "imageUrl" = '/exercises/pec-deck/0.jpg' WHERE LOWER(name) LIKE '%pec deck%' OR LOWER(name) LIKE '%machine fl%';
UPDATE exercises SET "imageUrl" = '/exercises/dumbbell-pullover/0.jpg' WHERE LOWER(name) LIKE '%pullover%';
UPDATE exercises SET "imageUrl" = '/exercises/hammer-strength-press/0.jpg' WHERE LOWER(name) LIKE '%hammer strength%' OR LOWER(name) LIKE '%machine press%';

-- Back
UPDATE exercises SET "imageUrl" = '/exercises/barbell-row/0.jpg' WHERE LOWER(name) LIKE '%barbell row%' OR LOWER(name) LIKE '%bent over row%';
UPDATE exercises SET "imageUrl" = '/exercises/t-bar-row/0.jpg' WHERE LOWER(name) LIKE '%t-bar row%' OR LOWER(name) LIKE '%t bar row%';
UPDATE exercises SET "imageUrl" = '/exercises/one-arm-dumbbell-row/0.jpg' WHERE LOWER(name) LIKE '%one arm%row%' OR LOWER(name) LIKE '%single arm%row%' OR LOWER(name) LIKE '%dumbbell row%';
UPDATE exercises SET "imageUrl" = '/exercises/seated-cable-row/0.jpg' WHERE LOWER(name) LIKE '%seated cable row%' OR LOWER(name) LIKE '%seated row%' OR LOWER(name) LIKE '%pulley row%';
UPDATE exercises SET "imageUrl" = '/exercises/pull-up/0.jpg' WHERE LOWER(name) LIKE '%pull-up%' OR LOWER(name) LIKE '%pull up%' OR LOWER(name) LIKE '%pullup%';
UPDATE exercises SET "imageUrl" = '/exercises/chin-up/0.jpg' WHERE LOWER(name) LIKE '%chin-up%' OR LOWER(name) LIKE '%chin up%' OR LOWER(name) LIKE '%chinup%';
UPDATE exercises SET "imageUrl" = '/exercises/lat-pulldown/0.jpg' WHERE LOWER(name) LIKE '%lat pulldown%' OR LOWER(name) LIKE '%lat pull%down%';
UPDATE exercises SET "imageUrl" = '/exercises/close-grip-lat-pulldown/0.jpg' WHERE LOWER(name) LIKE '%close grip%pulldown%' OR LOWER(name) LIKE '%close-grip%pulldown%';
UPDATE exercises SET "imageUrl" = '/exercises/deadlift/0.jpg' WHERE LOWER(name) = 'deadlift' OR LOWER(name) LIKE '%barbell deadlift%' OR LOWER(name) LIKE '%conventional deadlift%';
UPDATE exercises SET "imageUrl" = '/exercises/hyperextension/0.jpg' WHERE LOWER(name) LIKE '%hyperextension%' OR LOWER(name) LIKE '%back extension%';
UPDATE exercises SET "imageUrl" = '/exercises/face-pull/0.jpg' WHERE LOWER(name) LIKE '%face pull%';

-- Shoulders
UPDATE exercises SET "imageUrl" = '/exercises/overhead-press/0.jpg' WHERE LOWER(name) LIKE '%overhead press%' OR LOWER(name) LIKE '%military press%' OR LOWER(name) LIKE '%shoulder press%';
UPDATE exercises SET "imageUrl" = '/exercises/seated-dumbbell-press/0.jpg' WHERE LOWER(name) LIKE '%seated dumbbell%press%';
UPDATE exercises SET "imageUrl" = '/exercises/arnold-press/0.jpg' WHERE LOWER(name) LIKE '%arnold press%';
UPDATE exercises SET "imageUrl" = '/exercises/behind-the-neck-press/0.jpg' WHERE LOWER(name) LIKE '%behind the neck%' OR LOWER(name) LIKE '%behind-the-neck%';
UPDATE exercises SET "imageUrl" = '/exercises/barbell-clean-and-press/0.jpg' WHERE LOWER(name) LIKE '%clean and press%';
UPDATE exercises SET "imageUrl" = '/exercises/lateral-raise/0.jpg' WHERE (LOWER(name) LIKE '%lateral raise%' OR LOWER(name) LIKE '%side raise%') AND LOWER(name) NOT LIKE '%cable%';
UPDATE exercises SET "imageUrl" = '/exercises/cable-lateral-raise/0.jpg' WHERE LOWER(name) LIKE '%cable%lateral%';
UPDATE exercises SET "imageUrl" = '/exercises/front-raise/0.jpg' WHERE LOWER(name) LIKE '%front raise%';
UPDATE exercises SET "imageUrl" = '/exercises/rear-delt-fly/0.jpg' WHERE LOWER(name) LIKE '%rear delt%' OR LOWER(name) LIKE '%reverse fly%';
UPDATE exercises SET "imageUrl" = '/exercises/upright-row/0.jpg' WHERE LOWER(name) LIKE '%upright row%';
UPDATE exercises SET "imageUrl" = '/exercises/shrug/0.jpg' WHERE LOWER(name) LIKE '%shrug%';

-- Biceps
UPDATE exercises SET "imageUrl" = '/exercises/barbell-curl/0.jpg' WHERE LOWER(name) LIKE '%barbell curl%' AND LOWER(name) NOT LIKE '%reverse%';
UPDATE exercises SET "imageUrl" = '/exercises/dumbbell-curl/0.jpg' WHERE LOWER(name) LIKE '%dumbbell curl%' AND LOWER(name) NOT LIKE '%incline%' AND LOWER(name) NOT LIKE '%concentration%' AND LOWER(name) NOT LIKE '%hammer%';
UPDATE exercises SET "imageUrl" = '/exercises/preacher-curl/0.jpg' WHERE LOWER(name) LIKE '%preacher curl%';
UPDATE exercises SET "imageUrl" = '/exercises/spider-curl/0.jpg' WHERE LOWER(name) LIKE '%spider curl%';
UPDATE exercises SET "imageUrl" = '/exercises/machine-curl/0.jpg' WHERE LOWER(name) LIKE '%machine curl%' OR LOWER(name) LIKE '%bicep curl machine%';
UPDATE exercises SET "imageUrl" = '/exercises/cable-curl/0.jpg' WHERE LOWER(name) LIKE '%cable curl%';
UPDATE exercises SET "imageUrl" = '/exercises/hammer-curl/0.jpg' WHERE LOWER(name) LIKE '%hammer curl%';
UPDATE exercises SET "imageUrl" = '/exercises/concentration-curl/0.jpg' WHERE LOWER(name) LIKE '%concentration curl%';
UPDATE exercises SET "imageUrl" = '/exercises/incline-dumbbell-curl/0.jpg' WHERE LOWER(name) LIKE '%incline%curl%';
UPDATE exercises SET "imageUrl" = '/exercises/reverse-barbell-curl/0.jpg' WHERE LOWER(name) LIKE '%reverse%curl%';

-- Triceps
UPDATE exercises SET "imageUrl" = '/exercises/dips/0.jpg' WHERE LOWER(name) LIKE '%dip%' AND LOWER(name) NOT LIKE '%machine%';
UPDATE exercises SET "imageUrl" = '/exercises/tricep-pushdown/0.jpg' WHERE LOWER(name) LIKE '%tricep%pushdown%' OR LOWER(name) LIKE '%triceps pushdown%';
UPDATE exercises SET "imageUrl" = '/exercises/rope-pushdown/0.jpg' WHERE LOWER(name) LIKE '%rope%pushdown%' OR LOWER(name) LIKE '%rope%pressdown%';
UPDATE exercises SET "imageUrl" = '/exercises/overhead-tricep-extension/0.jpg' WHERE LOWER(name) LIKE '%overhead%tricep%' OR LOWER(name) LIKE '%overhead%extension%';
UPDATE exercises SET "imageUrl" = '/exercises/skull-crusher/0.jpg' WHERE LOWER(name) LIKE '%skull crush%' OR LOWER(name) LIKE '%lying tricep%';
UPDATE exercises SET "imageUrl" = '/exercises/barbell-french-press/0.jpg' WHERE LOWER(name) LIKE '%french press%';
UPDATE exercises SET "imageUrl" = '/exercises/one-arm-dumbbell-tricep-extension/0.jpg' WHERE LOWER(name) LIKE '%one arm%tricep%' OR LOWER(name) LIKE '%single arm%tricep%';

-- Legs - Quads
UPDATE exercises SET "imageUrl" = '/exercises/barbell-back-squat/0.jpg' WHERE LOWER(name) LIKE '%back squat%' OR LOWER(name) = 'squat' OR LOWER(name) = 'squats' OR LOWER(name) LIKE '%barbell squat%';
UPDATE exercises SET "imageUrl" = '/exercises/front-squat/0.jpg' WHERE LOWER(name) LIKE '%front squat%';
UPDATE exercises SET "imageUrl" = '/exercises/smith-machine-squat/0.jpg' WHERE LOWER(name) LIKE '%smith%squat%';
UPDATE exercises SET "imageUrl" = '/exercises/hack-squat/0.jpg' WHERE LOWER(name) LIKE '%hack squat%';
UPDATE exercises SET "imageUrl" = '/exercises/sissy-squat/0.jpg' WHERE LOWER(name) LIKE '%sissy squat%';
UPDATE exercises SET "imageUrl" = '/exercises/bulgarian-split-squat/0.jpg' WHERE LOWER(name) LIKE '%bulgarian%' OR LOWER(name) LIKE '%split squat%';
UPDATE exercises SET "imageUrl" = '/exercises/lunge/0.jpg' WHERE LOWER(name) LIKE '%lunge%';
UPDATE exercises SET "imageUrl" = '/exercises/leg-press/0.jpg' WHERE LOWER(name) LIKE '%leg press%';
UPDATE exercises SET "imageUrl" = '/exercises/leg-extension/0.jpg' WHERE LOWER(name) LIKE '%leg extension%';

-- Legs - Hamstrings
UPDATE exercises SET "imageUrl" = '/exercises/romanian-deadlift/0.jpg' WHERE LOWER(name) LIKE '%romanian%' OR LOWER(name) LIKE '%stiff leg%' OR LOWER(name) LIKE '%straight leg%';
UPDATE exercises SET "imageUrl" = '/exercises/lying-leg-curl/0.jpg' WHERE LOWER(name) LIKE '%lying%curl%' OR LOWER(name) LIKE '%hamstring curl%';
UPDATE exercises SET "imageUrl" = '/exercises/seated-leg-curl/0.jpg' WHERE LOWER(name) LIKE '%seated%curl%' AND LOWER(name) LIKE '%leg%';
UPDATE exercises SET "imageUrl" = '/exercises/standing-leg-curl/0.jpg' WHERE LOWER(name) LIKE '%standing%curl%' AND LOWER(name) LIKE '%leg%';
UPDATE exercises SET "imageUrl" = '/exercises/good-morning/0.jpg' WHERE LOWER(name) LIKE '%good morning%';

-- Calves
UPDATE exercises SET "imageUrl" = '/exercises/seated-calf-raise/0.jpg' WHERE LOWER(name) LIKE '%seated calf%';
UPDATE exercises SET "imageUrl" = '/exercises/standing-calf-raise/0.jpg' WHERE LOWER(name) LIKE '%standing calf%' OR (LOWER(name) LIKE '%calf raise%' AND LOWER(name) NOT LIKE '%seated%' AND LOWER(name) NOT LIKE '%donkey%');
UPDATE exercises SET "imageUrl" = '/exercises/donkey-calf-raise/0.jpg' WHERE LOWER(name) LIKE '%donkey calf%';

-- Forearms
UPDATE exercises SET "imageUrl" = '/exercises/wrist-curl/0.jpg' WHERE LOWER(name) LIKE '%wrist curl%' AND LOWER(name) NOT LIKE '%reverse%';
UPDATE exercises SET "imageUrl" = '/exercises/reverse-wrist-curl/0.jpg' WHERE LOWER(name) LIKE '%reverse wrist%';
UPDATE exercises SET "imageUrl" = '/exercises/wrist-roller/0.jpg' WHERE LOWER(name) LIKE '%wrist roller%';

-- Abs / Core
UPDATE exercises SET "imageUrl" = '/exercises/crunch/0.jpg' WHERE LOWER(name) LIKE '%crunch%' AND LOWER(name) NOT LIKE '%reverse%' AND LOWER(name) NOT LIKE '%cable%';
UPDATE exercises SET "imageUrl" = '/exercises/reverse-crunch/0.jpg' WHERE LOWER(name) LIKE '%reverse crunch%';
UPDATE exercises SET "imageUrl" = '/exercises/sit-up/0.jpg' WHERE LOWER(name) LIKE '%sit-up%' OR LOWER(name) LIKE '%sit up%' OR LOWER(name) LIKE '%situp%';
UPDATE exercises SET "imageUrl" = '/exercises/hanging-knee-raise/0.jpg' WHERE LOWER(name) LIKE '%hanging%raise%' OR LOWER(name) LIKE '%hanging leg%';
UPDATE exercises SET "imageUrl" = '/exercises/cable-crunch/0.jpg' WHERE LOWER(name) LIKE '%cable crunch%';
UPDATE exercises SET "imageUrl" = '/exercises/leg-raise/0.jpg' WHERE LOWER(name) LIKE '%leg raise%' AND LOWER(name) NOT LIKE '%hanging%';
UPDATE exercises SET "imageUrl" = '/exercises/plank/0.jpg' WHERE LOWER(name) = 'plank' OR LOWER(name) LIKE '%plank%';
UPDATE exercises SET "imageUrl" = '/exercises/russian-twist/0.jpg' WHERE LOWER(name) LIKE '%russian twist%';
UPDATE exercises SET "imageUrl" = '/exercises/mountain-climber/0.jpg' WHERE LOWER(name) LIKE '%mountain climber%';
UPDATE exercises SET "imageUrl" = '/exercises/dead-bug/0.jpg' WHERE LOWER(name) LIKE '%dead bug%';

-- Cardio
UPDATE exercises SET "imageUrl" = '/exercises/treadmill-run/0.jpg' WHERE LOWER(name) LIKE '%treadmill%';
UPDATE exercises SET "imageUrl" = '/exercises/stationary-bike/0.jpg' WHERE LOWER(name) LIKE '%stationary bike%' OR LOWER(name) LIKE '%cycling%' OR LOWER(name) LIKE '%bicycle%';
UPDATE exercises SET "imageUrl" = '/exercises/rowing-machine/0.jpg' WHERE LOWER(name) LIKE '%rowing%';
UPDATE exercises SET "imageUrl" = '/exercises/elliptical/0.jpg' WHERE LOWER(name) LIKE '%elliptical%';
UPDATE exercises SET "imageUrl" = '/exercises/jump-rope/0.jpg' WHERE LOWER(name) LIKE '%jump rope%' OR LOWER(name) LIKE '%rope jumping%';

-- Mobility
UPDATE exercises SET "imageUrl" = '/exercises/cat-cow-stretch/0.jpg' WHERE LOWER(name) LIKE '%cat%cow%' OR LOWER(name) LIKE '%cat stretch%';
UPDATE exercises SET "imageUrl" = '/exercises/hip-flexor-stretch/0.jpg' WHERE LOWER(name) LIKE '%hip flexor%';
UPDATE exercises SET "imageUrl" = '/exercises/shoulder-dislocation/0.jpg' WHERE LOWER(name) LIKE '%shoulder%stretch%' OR LOWER(name) LIKE '%shoulder dislocation%';

-- Summary: This updates ~94 exercises with their image paths
-- Images are located in /public/exercises/{exercise-slug}/0.jpg and 1.jpg
-- Source: free-exercise-db (Unlicense - Public Domain)
