Analyse the whole project structure and when you're done just say "I'm ready". Don't code.

Read docs/aesthetics.md.

I had a look at https://dev.massimino.fitness/workout-log and saw many bugs and errors. We start with this one after I clicked "Log set 4/4" of a given exercise from the CBUM Training Program:

1. When I go to the tab Programs in http://localhost:3000/workout-log and I click to a given program, such as "Chris Bumstead (CBUM) Training Program" and I click on "Back to Programs", I don't go back to the tab Programs, but to the tab Today, even if in the browser bar I see http://localhost:3000/workout-log?tab=programs
The right flow would be:
User -> Login -> Dashboard -> Workout Logs -> Programs -> Any program -> Back to Programs -> Programs

I am checking that everything works out when the user uses Massimino in smartphone view. I'm following the training plan "Christian Bumsted (CBum) Training Program" in my Workout Log's Today tab. I am now at the exercise Assisted Pull Up Inclined. It shows some issues;




  # Migrating from IONOS + Vercel to SiteGround

  Here's how to migrate your domain and hosting:

  1. Prepare Your SiteGround Account

  - Sign up for a SiteGround hosting plan that supports Node.js (you'll need at least their GoGeek plan or Cloud hosting for Next.js apps)
  - Note: SiteGround is primarily optimized for PHP/WordPress. Next.js apps require Node.js support, which is limited on SiteGround's shared
  hosting

  2. Domain Transfer (IONOS → SiteGround)

  1. Unlock the domain at IONOS: Go to IONOS domain settings and disable domain lock
  2. Get the authorization/EPP code from IONOS
  3. Initiate transfer at SiteGround: Go to SiteGround > Services > Domains > Transfer Domain
  4. Enter the EPP code when prompted
  5. Approve the transfer via email (usually takes 5-7 days)

  3. Hosting Migration Considerations

  Important caveat: SiteGround doesn't natively support Next.js/Vercel-style deployments. Your options:

  Option A: Static Export (if your app allows)

  - Export your Next.js app as static HTML (next export)
  - Upload to SiteGround via FTP/File Manager
  - Limited functionality (no API routes, no SSR)

  Option B: Use SiteGround's Cloud Hosting

  - Get their cloud hosting plan
  - Set up Node.js environment manually
  - Deploy via SSH/Git
  - More complex, requires server management

  Option C: Keep a Separate Node.js Host

  - Transfer domain to SiteGround
  - Point DNS to a Node.js-friendly platform (Railway, Render, Fly.io - all cheaper than Vercel)
  - Use SiteGround just for domain management

  4. DNS Configuration

  - After domain transfer, update DNS records at SiteGround to point to wherever your app is hosted
  - Update nameservers if needed

  My Recommendation

  Given that Massimino is a Next.js app with API routes and likely uses SSR features, SiteGround may not be the best fit for hosting the
  application itself. Consider:

  1. Transfer domain to SiteGround (or Cloudflare, which offers free domain management)
  2. Host the app on: Railway, Render, or Fly.io - all significantly cheaper than Vercel and properly support Next.js

  This gives you cost savings without losing Next.js functionality.


  Cancelling IONOS Contracts

  Steps to Cancel

  1. Log into IONOS Control Panel
    - Go to https://my.ionos.com
    - Sign in with your account
  2. Navigate to Contracts
    - Click on "Contracts & Billing" or "My Contracts" in the menu
    - You'll see a list of all your active services
  3. Cancel Each Contract
    - Click on the contract you want to cancel
    - Look for "Cancel Contract" or "Terminate" option (usually under contract details or a gear/settings icon)
    - Follow the cancellation wizard
  4. Important Before Cancelling
    - Make sure your domain transfer is complete before cancelling the domain contract
    - Download any emails, files, or backups you need
    - Note any renewal dates - you may need to cancel before a specific date to avoid charges

  Things to Watch Out For

  - Cancellation notice periods: IONOS often requires 30 days notice
  - Auto-renewal: Disable auto-renewal immediately if you can't cancel right away
  - Confirmation email: Keep the cancellation confirmation for your records
  - Refunds: Check if you're eligible for a prorated refund for unused time

  If You Have Trouble

  IONOS cancellation can sometimes be buried in menus. You can also:
  - Call IONOS support directly
  - Use their live chat
  - Send a written cancellation request via email to their support

  Contracts You Likely Have

  Based on your setup, look for:
  - Domain registration contract (cancel AFTER transfer completes)
  - Any hosting/webspace contracts
  - Email contracts (if applicable)


1. The user should be able to click on a any exercise in any program and see how the exercise has to be done. This does not happen in these programs:
http://localhost:3000/workout-log/programs/arnold-golden-six
http://localhost:3000/workout-log/programs/colorado-experiment-hit
http://localhost:3000/workout-log/programs/nasm-fat-loss-program
http://localhost:3000/workout-log/programs/nasm-muscle-gain-program
http://localhost:3000/workout-log/programs/nasm-performance-program
http://localhost:3000/workout-log/programs/cbum-classic-physique
http://localhost:3000/workout-log/programs/arnold-volume-workout

2. No media in these programs:
http://localhost:3000/workout-log/programs/arnold-golden-six
http://localhost:3000/workout-log/programs/colorado-experiment-hit
http://localhost:3000/workout-log/programs/nasm-fat-loss-program
http://localhost:3000/workout-log/programs/nasm-performance-program
http://localhost:3000/workout-log/programs/cbum-classic-physique

3. Exercises are still missing in:
http://localhost:3000/workout-log/programs/linear-periodization-12week
http://localhost:3000/workout-log/programs/mike-mentzer-heavy-duty
http://localhost:3000/workout-log/programs/ronnie-coleman-mass-builder
http://localhost:3000/workout-log/programs/aesthetics-hunter
http://localhost:3000/workout-log/programs/bye-stress-bye
http://localhost:3000/workout-log/programs/i-just-became-a-dad
http://localhost:3000/workout-log/programs/i-just-became-a-mum
http://localhost:3000/workout-log/programs/i-dont-have-much-time
http://localhost:3000/workout-log/programs/wanna-lose-beer-belly
http://localhost:3000/workout-log/programs/flexibility-workout
http://localhost:3000/workout-log/programs/plyometric-workout
http://localhost:3000/workout-log/programs/balance-workout
http://localhost:3000/workout-log/programs/cardio-workout

4. Workouts without:
http://localhost:3000/workout-log/programs/7fc24d91-bfc4-4891-88d9-d16f6ef847a0
http://localhost:3000/workout-log/programs/e1ca9441-592d-4b77-b2c0-cd9d145aa978
http://localhost:3000/workout-log/programs/16f26199-cc6b-406e-b5d9-c2f875009a59
http://localhost:3000/workout-log/programs/a40f0651-c71d-41d2-89d9-39aee51f2de7
http://localhost:3000/workout-log/programs/5fa59907-0539-4b4e-a672-9436952bf83b
http://localhost:3000/workout-log/programs/cf536aed-36cb-4910-9779-883468e83fb5
http://localhost:3000/workout-log/programs/7919c860-8142-4b09-b2c7-15d58eca9ac0
http://localhost:3000/workout-log/programs/446d2007-9dcc-4677-97c7-91fdc8be3c28
http://localhost:3000/workout-log/programs/c36ed938-5b00-42e3-bfa0-5cb9acb73b16
http://localhost:3000/workout-log/programs/17c68871-e476-44d7-b06a-e91830d3ab3b
http://localhost:3000/workout-log/programs/385967f9-3435-449f-9302-5777192d17ec
http://localhost:3000/workout-log/programs/7676e9ea-e2fb-4156-9a08-2cf26963b84f