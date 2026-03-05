https://developer.apple.com/app-store/submitting/

Update for new OS releases
Build and test with Xcode 26, which supports the latest SDKs for iOS, iPadOS, macOS, tvOS, visionOS, and watchOS to take advantage of the latest advancements in Apple platforms. Make sure your apps and games work as expected on Apple devices running the latest OS releases. Starting April 28, 2026, apps and games uploaded to App Store Connect need to meet the following minimum requirements.

iOS and iPadOS apps must be built with the iOS & iPadOS 26 SDK or later
tvOS apps must be built with the tvOS 26 SDK or later
visionOS apps must be built with the visionOS 26 SDK or later
watchOS apps must be built with the watchOS 26 SDK or later
Download Xcode 26


Set up in App Store Connect
When you distribute on the App Store, people around the world can discover and download your apps and games in 175 storefronts and 40 languages.

App Review
The guiding principle of the App Store is simple — we want to provide a trusted experience for people to get apps and games, and a great opportunity for developers to succeed. To do this, Apple reviews all apps, app updates, bundles, In-App Purchases, and In-App Events to evaluate they meet requirements for privacy, security, safety, and reliability. As you plan and build, get acquainted with the App Review Guidelines early on in your app or game’s development in order to make appropriate design decisions and help your review process goes as smooth as possible.

Learn about App Review

TestFlight
You can get feedback on your apps, games, and App Clips throughout your development using TestFlight, Apple’s beta app testing service. Simply add testers from your internal team, or invite external testers via email or public link. Testers download, test, and provide feedback on your beta app, using the TestFlight app. You can then use their provided feedback — including screenshots with contextual feedback, or crash details — to improve your app or game.

Learn about TestFlight

Product page
Make sure your app’s name, icon, description, screenshots, app previews, and keywords are ready for your App Store product page. You can also take this opportunity to update your subtitle and promotional text, and choose to promote any new In-App Purchases.

Age ratings. The age rating system for apps and games has been updated to provide people with more granular age ratings and categories. The current rating for each of your apps has been automatically adjusted to align with this new system and will be reflected on Apple devices running a minimum of iOS 26, iPadOS 26, macOS 26, tvOS 26, visionOS 26, and watchOS 26. You can view the age rating in the App Information section of your app in App Store Connect.

App privacy details. Enter all necessary information about your app’s privacy practices, including the practices of third‑party partners whose code you integrate into your app, in App Store Connect. These details inform the Privacy Nutrition Label that appears on your product page and are required in order to submit new apps and app updates to the App Store.

Accessibility support. You can now share information in App Store Connect about your app or game’s support — such as whether it includes VoiceOver, Voice Control, Larger Text, Captions, and more. Based on this information, an Accessibility Nutrition Label will appear on your App Store product page, specific to each platform you support. If you’d like, you can also add a URL on your App Store product page that links people to a website with even more details.

Custom product pages. In addition to your default product page, you can use custom product pages to showcase a particular feature, content, character, or aspect of gameplay. Highlight this content on each page with unique screenshots, app previews, and promotional text that differ from your default product page. Share a particular page with people by using its unique URL in your marketing efforts or Apple Ads campaigns.

Product page optimization. Test different elements of your App Store product page to understand if different app icons, screenshots, or app preview videos result in more engagement.

Learn about creating product pages

Availability options
Required device capabilities. The App Store is designed to provide users with apps that work seamlessly with their devices‘ capabilities. Verify that your information property list (info.plist) is compatible with any device requirements when submitting a new app that takes advantage of the latest technologies.

Apps for Macs with Apple silicon. If your Mac app requires the high performance of Apple silicon, you can make your app available on the Mac App Store only to Macs with an M1 chip or later. To only support Macs with Apple silicon, your app must require a minimum OS version of macOS Monterey 12 or later, and have never supported Intel-based Macs. In Xcode, update the Architectures build setting for your target and specify to build ARM64 only. Apps can add Intel support and lower the minimum OS version in an update but, once released, they cannot return to only supporting Apple silicon.

Universal purchase. With universal purchase, people can discover and enjoy your app or game across their Apple devices with a single purchase. In-App Purchases and subscriptions can also easily be set up and shared across platforms. Your product page will show the other platforms your app supports along with screenshots. And you’ll be able to promote your app using a single URL across your marketing channels.

iPadOS and iOS apps on Mac and Apple Vision Pro. Most iPadOS and iOS apps can run unmodified on Apple Vision Pro and on Macs with Apple silicon, so your app can easily extend to these platforms — with no additional work required. By default, your compatible apps are published automatically on the App Store for Apple Vision Pro or Mac using the metadata you’ve already provided in App Store Connect.

Learn about managing your app’s availability


Increase discoverability
Boost your game and app discoverability with built-in promotional features on the App Store and App Store Connect.

In-App Events
Promote timely content within your app or game — such as game competitions, movie premieres, livestreamed experiences, and more — using In-App Events. People can find In-App Events across the App Store, including on your product page, in search results, and on the Today, Games, and Apps tabs.

Learn about In-App Events


Apple Games app
Games that are available on the App Store will automatically appear on the Games app, including in search results, the Library tab, and the Continue Playing section. Additionally, games that include Game Center features and In-App Events are prominently displayed across the Games app in order to help players discover and engage deeper with them.

Learn about the Games app

Featuring Nominations
The App Store showcases incredible apps and games that people love across Apple platforms, and shines a spotlight on developers from communities around the world. Each Apple platform has a dedicated App Store to help people discover the best apps, games, in-app content, and more. You can use Featuring Nominations in App Store Connect to share your story with our team.

Learn about getting featured

Custom marketing assets
The App Store marketing tools and the App Store Connect app provide you with premade assets to celebrate moments such as a launch, new version, and more. Simply download your selected assets, then share them using your social media or marketing channels to amplify your app or game.

Learn about marketing assets

---

https://developer.apple.com/distribute/app-review/

App Review
We review all apps, app updates, app bundles, in-app purchases, and in-app events submitted to App Store Connect to help provide a safe and trusted experience for users and the opportunity for developers to succeed. As you plan and build, use these guidelines and resources to help the review process go as smoothly as possible.

Preparing for review
Guidelines
Apple Developer Program License Agreement
App review information
Submitting for review
Avoiding common issues
Contacting us
Preparing for review
Learn about the guidelines your submission needs to follow and information you’ll provide for review.

Guidelines
Get in-depth details on the technical, content, and design criteria that we use for review, and learn about other key guidelines.

App Review Guidelines
Human Interface Design Guidelines
Guidelines for Using Apple Trademarks and Copyrights
Apple Developer Program License Agreement
The Apple Developer Program License Agreement details your obligations and responsibilities for the use of Apple software and services. The latest agreement can be found on the Agreements and Guidelines page.

Read the latest license agreement

Alternative Terms Addendum for Apps in the EU
To distribute your app from an alternative app marketplace or use alternative payment options on the App Store in the European Union, you'll need to review and sign an addendum to the Apple Developer Program License Agreement.

App review information
If your app requires specific settings, user account information, or special instructions, include these details in the App Review Information section of App Store Connect. If you don’t include this information, the app review process may be delayed and your app may not pass review.

For more details, view App Store Connect Help.

Submitting for review
When you submit for review in App Store Connect, you can:

Manage your submissions and communicate with App Review on the App Review page within Apps. You can visit the App Review page at any time, even if you don’t have active submissions or conversations.
Submit items such as in-app events, custom product pages, and product page optimization tests without needing a new app version.
Include multiple items in one submission.
Remove items with issues from your submission and continue with items that were accepted by App Review.
View a history of submissions created using the updated experience, including messages from App Review.
Decide whether your app is reviewed for the App Store or Notarization only.
Review status
On average, 90% of submissions are reviewed in less than 24 hours. You’ll be notified by email of status changes. You can also check the review status of your submission in the Apps section of App Store Connect or on the App Store Connect app for iPhone and iPad. If your submission is incomplete, review times may be delayed or your submission may not pass.

For status details, view App Store Connect Help.

Avoiding common issues
We’ve highlighted some of the most common issues to help you better prepare before submitting for review. On average, over 40% of unresolved issues are related to guideline 2.1: App Completeness, which covers crashes, placeholder content, incomplete information, and more.

Watch “Tips for preventing common review issues”

Crashes and bugs
Submit items for review only when they’re complete and ready to be published. Make sure to thoroughly test on devices running the latest software and fix all bugs before submitting. View guideline 2.1.

Broken links
All links in your app must be functional. A link to user support with up-to-date contact information and a link to your privacy policy is required for all apps. View guideline 2.1 and guideline 5.1.

Placeholder content
Finalize all images and text before submitting for review. Items that are still in progress and contain placeholder content are not ready to be distributed and cannot be approved. View guideline 2.1.

Incomplete information
Enter all of the details needed for review in the App Review Information section of App Store Connect. If some features require signing in, provide a valid demo account username and password. If there are special configurations to set, include the specifics. If features require an environment that is hard to replicate or require specific hardware, be prepared to provide a demo video or the hardware. Also, please make sure your contact information is complete and up to date. View guideline 2.1.

Specific documentation is required for certain scenarios and types of apps. Here are a few examples:

If the app is for kids and contains third-party ads, provide a link to the ad services’ publicly documented practices and policies for Kids category apps, including human review of ad creatives for age appropriateness. View guideline 1.3.
If the app works with medical hardware, provide a copy of regulatory clearance for the locations where the app is available. View guideline 1.4.
If the app features third-party trademarks or copyrighted content or lets users stream or download third-party content, provide the authorization to do so. Examples include video streaming and marketing that uses imagery of celebrities, sports, movies, or music. View guideline 4.1 and guideline 5.2.
If the app facilitates services requiring licensing, such as real money gaming and gambling, lotteries, raffles, and VPN licensing, provide the authorization to do so. Note that licensing requirements may vary depending on region. View guideline 5.
Privacy policy issues
Make sure your privacy policy adheres to guideline 5.1 and:

Identifies the data the app collects, how it collects that data, and all uses of that data.
Confirms that any third party with whom the app shares user data provides the same or equal protection of user data as stated in the app’s privacy policy.
Explains your data retention and deletion policies and describes how a user can revoke consent and/or request deletion of their data.
Watch “Do more with less data”

Unclear data access requests
When requesting permission to access user or usage data, you should clearly and completely describe how your app will use the data. Including an example can help users understand why your app is requesting access to their personal information. View guideline 5.1.

If your app’s code references one or more APIs that access sensitive user data, the app’s Info.plist file should contain a $!{infoPlistKey} key with a user-facing purpose string explaining clearly and completely why your app needs the data. All apps submitted to App Store Connect that access user data are required to include a purpose string.

Learn about requesting permission

Watch “Write clear purpose strings”

Inaccurate screenshots
Screenshots should accurately communicate value and functionality. Use text and overlay images to highlight the user experience, not obscure it. Make sure your UI and product images match the corresponding device type in App Store Connect. View guideline 2.3.

 
Substandard user interface
Apple places a high value on clean, refined, and user-friendly interfaces. Make sure your UI meets these requirements by planning your design carefully and following our design guides.

 
Web clippings, content aggregators, or a collection of links
Your app should be engaging and useful, and make the most of the features unique to iOS. Websites served in an iOS app, web content that is not formatted for iOS, and limited web interactions do not make a quality app. View guideline 4.2.

Repeated submission of similar apps
Submitting several apps that are essentially the same ties up the App Review process and risks your apps not passing review. Improve your review experience — and the experience of your future users — by thoughtfully combining your apps into one. View guideline 4.3.

Copycats
When working on your app, focus on creating interesting, unique experiences that aren’t already available. Apps that actively try to copy other apps won’t pass review. To learn more, view Preventing Copycat and Impersonation Rejections and guideline 4.1.

Misleading users
Your app must perform as advertised and should not give users the impression the app is something it is not. If your app appears to promise certain features and functionalities, it needs to deliver. View guideline 2.3.

Not enough lasting value
If your app doesn’t offer much functionality or content, or only applies to a small niche market, it may not be approved. Before creating your app, take a look at the apps in your category on the App Store and consider how you can provide an even better user experience. View guideline 4.2.

Submitted by incorrect entity
Certain types of apps must be submitted by the legal entity that provides the services rather than an individual developer. These apps include, but are not limited to, those that require sensitive user information or provide services in highly regulated fields, such as banking and financial services, cryptocurrency, healthcare, gambling, and air travel. If you need to provide partnership documentation or authorization, attach the files in the Attachment section in App Store Connect and provide any descriptions or links in the Review Notes field. View guideline 3 and guideline 5.1.1.


Technical Support
If your app didn’t pass review for technical reasons, such as crashes or bugs, view the following documentation:

Acquiring Crash Reports and Diagnostic Logs
Analyzing a Crash Report
Identifying the Cause of Common Crashes
You can also visit the Apple Developer Forums or request code-level support.

Contacting us
App Review submissions
You can view your past and current submissions to App Review in App Store Connect. If your submission didn’t pass review, details are provided, including any specific App Review Guidelines that your submission didn’t follow. You can correspond with App Review to resolve the issues before resubmitting the build. Access the App Review section on the app’s page in App Store Connect.

Learn about corresponding with App Review

Appointment
Meet with App Review over Webex to discuss the App Review Guidelines and explore best practices for a smooth review process. In each 30-minute video appointment, you can ask for advice on what to expect during review, how your app can best align with guidelines, reasons for common rejections, and topics related to the process of reviewing your app.

View schedule

Appeals
If your app didn’t pass review and you feel we misunderstood your app’s concept and functionality, or that you were treated unfairly by Apple in the course of our review, you may choose to submit an appeal to the App Review Board. If you file an appeal, make sure to:

Provide specific reasons why you believe your app complies with the App Review Guidelines.
Submit only one appeal per submission that didn’t pass review.
Respond to any requests for additional information before submitting an appeal.
Submit an appeal

Expedited reviews
You can request the review of your app to be expedited if you face extenuating circumstances, such as fixing a critical bug in your app or releasing your app to coincide with an event you’re directly associated with.

Critical bug fix. When submitting an expedited review to fix a critical bug, include the steps to reproduce the bug on the current version of your app.

Event-related app. For apps associated with an event, we recommend you plan and schedule the release of your app in App Store Connect. However, if your app is still in review and the launch of your event is quickly approaching, you can request to have your app review expedited. Make sure your request includes the event, date of the event, and your app’s association with the event.

Request an expedited review

Bug fix submissions
If you’re submitting a bug fix update for your app and we find additional issues during review, you have the option to resolve the additional issues with your next submission, as long as there are no legal or safety concerns. To accept, simply reply to the offer message in App Store Connect and indicate you would like the current submission to be approved.

View App Store Connect

Suggestions
Help improve the App Review Guidelines or identify a need for clarity in our policies by suggesting guideline changes. Your suggestions will be taken into consideration by App Review.

Make a suggestion

Report a concern
If you believe that an app presents a trust or safety concern, or is in violation of the App Review Guidelines, you can share details with us to investigate.

File a report

---

https://developer.apple.com/testflight/

Beta testing made simple with TestFlight
TestFlight makes it easy for testers to give feedback on your apps, games, and App Clips across Apple platforms before you publish. Share your beta with just your team, or the public. Learn how to get started with TestFlight.


Get started
To get started with TestFlight, go to the Apps section of App Store Connect and select the app, game, or App Clip you want to test. You’ll then select the TestFlight tab and add test information that lets people know what you’d like them to test, along with any other relevant information they should know. You’ll also need to provide an email address so you can monitor and respond to any tester feedback. Keep in mind your beta app description and beta app review information are required in order to share your beta with external testers.

Next, upload a beta build of your app, game, or App Clip to App Store Connect. You can share up to 100 builds, and start testing multiple builds at once. Once your build is uploaded, you can invite internal and external testers.

Learn about getting started with TestFlight


Get started with TestFlight
Find testers
With TestFlight, it’s easy to find and manage testers. You don’t need to keep track of UDIDs, or provision tester profiles.

Testers use the TestFlight app to view your invite and install your beta. Your invite includes your beta app description that highlights new features and content your app or game offers. Apps and games with an approved version that’s ready for distribution can also include their screenshots and app category in their invite. And if they don’t accept your invite, people can leave feedback to let you know why.

Testers can access all available beta builds you’ve shared with them, on up to 30 devices for comprehensive testing.

Create tester groups
Groups are how you organize and distribute builds to testers. You can create multiple groups and add different builds to each one. For example, you might want a specific group to focus on testing on a new platform. Additionally, you can view tester metrics to better evaluate tester engagement and manage participation.

Add internal testers
Designate up to 100 members of your development team who hold the Account Holder, Admin, App Manager, Developer, or Marketing role as beta testers. You can also choose to automatically distribute new builds to internal testers, so they’re always testing the latest updates.

Invite external testers
You can also invite up to 10,000 external testers to join your beta program. To invite external testers, you’ll first create a group in App Store Connect, add the builds you’d like them to test, and have your first build already approved by App Review for TestFlight. Your builds are automatically sent for review once they’re added to a group.

Invite external testers using your choice of:

Email. Send people an invitation with a link to install your beta and start testing. This can be an effective way to enroll testers if you have a specific people and know their email addresses.
Public links. Include a public link in your marketing communications — such as email, social media, and more — to invite people to test your beta build. If you’re new to beta testing, public links can be a great way to establish a group of testers since you don’t need to have anyone’s contact information to invite them. To more easily enroll qualified testers and get more relevant feedback, you can set criteria, such as device type and OS version, for those who enroll via your public link.
To ensure a good user experience, be thoughtful about where you share your public link and when it may be appropriate to remove it. For example, if you’ve reached your tester limit, be sure to disable your link so people who try and join your beta will know it’s no longer accepting new testers. You can view how many testers viewed and installed your beta from a public link, as well as how many people met any criteria you’ve selected in App Store Connect.


Get feedback
Feedback is a key part of using TestFlight and helps you understand how to improve your app experience. Testers can take a screenshot from your app or game and easily share feedback. They can even mark up the image with relevant feedback or suggestions. If they experience a crash, you’ll receive a crash report and testers have the option of sharing additional context to help you troubleshoot the issue.

You can view feedback in the TestFlight section of App Store Connect, including screenshots, comments related to crashes, and any additional written feedback. Filter feedback by platform or OS version to get additional insight about potential improvements. You can find out how successful your public link is at enrolling testers for your app as well as understand how many testers viewed and accepted your invite. If you’ve chosen to set criteria for the public link, you can also view how many testers didn’t meet the criteria.

Submit and publish
When you’ve finished testing, be sure to incorporate any feedback before you distribute your app, game, or App Clip. Any builds you’ve already added in TestFlight will appear in App Store Connect. Simply select the build you wish to publish and submit it for review.

---

https://developer.apple.com/app-store/product-page/

Creating your product page
Every element of your App Store product page has the power to drive downloads of your app. Learn how to help customers discover your app and engage them through thoughtfully crafted metadata on your product page and in search results. You can build and maintain your product page in App Store Connect or automate your workflow with the App Store Connect API.

App name
Your app’s name plays a critical role in how users discover it on the App Store. Choose a simple, memorable name that is easy to spell and hints at what your app does. Be distinctive. Avoid names that use generic terms or are too similar to existing app names. An app name can be up to 30 characters long.

iPhone showing App Store product page for Forest Explorer app featuring rock climbing
App Name
Icon
Your app icon is one of the first elements of your app that users see, so it’s essential to make a strong first impression that communicates your app’s quality and purpose. Work with a graphic designer to create an icon that is simple and recognizable. Try testing different options to determine which icon is the most recognizable and meaningful to your target audience.

To ensure the icon is legible in all sizes, avoid adding unnecessary visual details. For information about creating a beautiful and memorable icon, see the Human Interface Guidelines.

iPhone showing App Store product page for Forest Explorer app featuring rock climbing
Icon
Subtitle
Your app’s subtitle is intended to summarize your app in a concise phrase. Consider using this, rather than your app’s name, to explain the value of your app in greater detail. Avoid generic descriptions such as “world’s best app.” Instead, highlight features or typical uses of your app that resonate with your audience. You can update your subtitle when submitting a new version of your app to help you determine the subtitle that’s most effective for engaging users. A subtitle can be up to 30 characters long and appears below your app’s name throughout the App Store.

iPhone showing App Store product page for Forest Explorer app featuring rock climbing
Subtitle
App previews
An app preview demonstrates the features, functionality, and UI of your app in a short video that users watch directly on the App Store. Previews can be up to 30 seconds long and use footage captured on the device to show the experience of using your app. You can feature up to three app previews on your App Store and Mac App Store product pages, and localize them for all available App Store languages.

App previews autoplay with muted audio when users view your product page, so make sure the first few seconds of your video are visually compelling. App preview poster frames appear whenever videos do not autoplay.

To learn about creating great app previews, see Show More with App Previews.

iPhone showing App Store product page for Forest Explorer app featuring rock climbing
App Preview
Screenshots
Use images captured from your app’s UI to visually communicate your app’s user experience. You can feature up to 10 screenshots on your App Store and Mac App Store product pages. Depending on the orientation of your screenshots, the first one to three images will appear in search results when no app preview is available, so make sure these highlight the essence of your app. Focus each subsequent screenshot on a main benefit or feature so that you fully convey your app’s value. If your app supports Dark Mode, consider including at least one screenshot that showcases what the experience looks like for users.

For screenshot specifications, see App Store Connect Help.


Screenshot
Description
Provide an engaging description that highlights the features and functionality of your app. The ideal description is a concise, informative paragraph followed by a short list of main features. Let potential users know what makes your app unique and why they’ll love it. Communicate in the tone of your brand, and use terminology your target audience will appreciate and understand. The first sentence of your description is the most important — this is what users can read without having to tap to read more. Every word counts, so focus on your app’s unique features.

If you choose to mention an accolade, we recommend putting it at the end of your description or as part of your promotional text. Don’t add unnecessary keywords to your description in an attempt to improve search results. Also avoid including specific prices in your app description. Pricing is already shown on the product page, and references within the description may not be accurate in all regions.

You can update your app’s description when you submit a new version of your app. If you want to share important updates more frequently, consider using your promotional text instead.

Promotional text
Your app’s promotional text appears at the top of the description and is up to 170 characters long. You can update promotional text at any time without having to submit a new version of your app. Consider using this to share the latest news about your app, such as limited-time sales or upcoming features.


Description
Keywords
Keywords help determine where your app displays in search results, so choose them carefully to ensure your app is easily discoverable. Choose keywords based on words you think your audience will use to find an app like yours. Be specific when describing your app’s features and functionality to help the search algorithm surface your app in relevant searches. Consider the trade-off between ranking well for less common terms versus ranking lower for popular terms. Popular, functional terms, such as “jobs” or “social”, may drive a lot of traffic, but are highly competitive in the rankings. Less common terms drive lower traffic, but are less competitive.

Keywords are limited to 100 characters total, with terms separated by commas and no spaces. (Note that you can use spaces to separate words within keyword phrases. For example: Property,House,Real Estate.) Maximize the number of words that fit in this character limit by avoiding the following:

Plurals of words that you’ve already included in singular form
Names of categories or the word “app”
Duplicate words
Special characters — such as # or @ — unless they’re part of your brand identity. Special characters don’t carry extra weight when users search for your app.
Improper use of keywords is a common reason for App Store rejections. Do not use the following in your keywords:

Unauthorized use of trademarked terms, celebrity names, and other protected words and phrases
Terms that are not relevant to the app
Competing app names
Irrelevant, inappropriate, offensive, or objectionable terms
In addition, keep in mind that promotional text doesn’t affect your app’s search ranking so it should not be used to display keywords.


In-app purchases
Users can view and start an in-app purchase from your product page. In-app purchases and subscriptions are shown in two separate sections on your product page, and you can showcase up to 20 total items across both of these sections. You can even choose the order in which to list them to help drive awareness for specific content. Each item has its own display name, promotional image, and description. In-app purchase names are limited to 35 characters and descriptions are limited to 55 characters, so be descriptive, accurate, and concise when highlighting their benefits.

In-app purchases can also appear in search results and be featured on the Today, Games, and Apps tabs. When users tap on an in-app purchase in these locations, they are taken to your product page where they can read your app’s description, view screenshots and app previews, or start the in-app purchase. If they don’t have your app installed on their device when they start the in-app purchase, they’ll be prompted to download or purchase the app to complete the transaction.

For details, see Promoting Your In-App Purchases.


In-App Purchase
What’s New
When you update your app, you can use What’s New to communicate changes to users. This text appears on your product page and on the Updates tab.

If you added a feature or fixed a bug based on feedback, use What’s New to let users know that you’ve listened to them. List new features, content, or functionality in order of importance, and add call-to-action messaging that gets users excited about the update.


What’s New
Ratings and reviews
Ratings and reviews influence how your app ranks in search and can encourage users to engage with your app from search results, so focus on providing a great app experience that motivates users to leave positive reviews. Individual ratings inform your app’s summary rating, which is displayed on your product page and in search results. This summary rating is specific to each territory on the App Store.

The SKStoreReviewController API lets you give users an easy way to provide feedback about your app. You can prompt for ratings up to three times in a 365-day period. Users will submit a rating through the standardized prompt, and can write and submit a review without leaving the app.

You can use App Store Connect to respond to customer reviews of your app to directly address their feedback, questions, and concerns. When you respond, the reviewer will be notified and will have the option to update their review. Reviews and responses can be updated at any time, but only the latest review and response for each user will display on your product page.

For details, see Ratings, Reviews, and Responses.


Categories
Categories on the App Store help users discover new apps to meet their needs. You can assign a primary and a secondary category to your app. The primary category is particularly important for discoverability, as it helps users find your app when browsing or filtering search results, and it determines in which tab your app appears on the App Store. Be sure to select the primary category that’s most relevant. Choosing categories that are not relevant to your app may cause your app to be rejected when submitted for review.

For details, see Choosing a Category.


Localization
If your app is available in multiple languages, make sure to localize your app description, keywords, app previews, and screenshots, for each of the markets in which you offer your app. You can also translate your app’s name and tailor your keywords to reflect the values of each market so your app might better resonate with the local audience.

For details, see Localize App Store information.

To learn about localizing your app, seeExpanding Your App to New Markets.


Get more from your product page
Product page optimization
Try out alternate versions of your app’s product page with different icons, screenshots, and app previews to find out which one gets the best results. Each version is shown to a percentage of randomly selected, eligible App Store users and results appear in App Analytics, so you can set the best performing one to display to everyone on the App Store.

Learn more

Custom product pages
Create additional versions of your app’s product page to highlight specific features or content, discoverable through unique URLs that you share. Custom product pages can have different screenshots, app previews, and promotional text — and are fully localizable — so you can showcase a particular sport, character, show, gameplay feature, and more.

Learn more

---

https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-of-iphone-and-ipad-apps-on-macs-with-apple-silicon/

Manage your app's availability
Manage availability of iPhone and iPad apps on Macs with Apple silicon
Users running macOS 11 or later on Macs with Apple silicon can access iPhone and iPad apps through the Mac App Store, provided no edits are made to the app availability. There's no porting process since these apps use the same frameworks, resources, and runtime environments as they do on iOS and iPadOS.

When an app supports universal purchase and already has a presence on the Mac App Store through the macOS platform, you won’t have the option to offer the iOS app on the Mac App Store. Additionally, if your iOS app is available on the Mac App Store by using this option and you later add a macOS app by adding the macOS platform in App Store Connect, releasing it to the store will replace the iOS app on the Mac App Store. Existing users of the iOS app will be updated to the macOS app.

You can choose to make your iPhone and iPad apps available, or not, on the Mac App Store for users running macOS 11 or later on Macs with Apple silicon. This is set at the app level and will apply to all versions of your app.

Apple automatically calculates the minimum macOS version using the LSMinimumSystemVersion from your build (if applicable) and the macOS version corresponding to your build's MinimumOSVersion. If you’ve selected a minimum macOS version in Pricing and Availability that's higher than either the LSMinimumSystemVersion or the macOS version corresponding to the MinimumOSVersion, the version you selected will be displayed instead.

Required role: Account Holder, Admin, or App Manager. View role permissions.


Edit availability on an individual app basis
In Apps, select the app you want to view.

In the sidebar, click Pricing and Availability and scroll down to the iPhone and iPad Apps on Apple Silicon Mac section.

Under Apple Silicon Mac Availability, deselect “Make this app available” to opt out of offering your app on the Mac App Store. Select the checkbox if you want the app to be available on the Mac App Store.

You can change the minimum macOS version required for compatibility in the menu. This selection also applies to tester groups enabled for testing iPhone and iPad apps on Macs with Apple silicon with TestFlight.

On the top right, click Save.


Edit availability for multiple apps at a time
In Apps, select iOS Apps on Mac Availability from the ellipsis menu (...) in the top left.

In the dialog that appears, deselect the iPhone and iPad apps you don’t want to make available on the Mac App Store.

Click Done.

To opt out of offering any of your iPhone and iPad apps on the Mac App Store for users running macOS 11 or later on Macs with Apple silicon, click Don’t Make Available.


Verify your app’s compatibility with Macs with Apple silicon
If your iPhone and iPad apps are compatible with Macs with Apple silicon and function as intended, verify them in App Store Connect to let users know they’ll receive a great experience on macOS. Once verified, this option will no longer be available in App Store Connect.

In Apps, select the app you want to view.

In the sidebar, click Pricing and Availability and scroll down to the iPhone and iPad Apps on Apple Silicon Mac section.

Under Compatibility with Apple Silicon Macs, click Verify Compatibility.

Note: Compatibility with Apple Silicon Macs isn’t available if a build has never been uploaded for the platform.

In the dialog that appears, click Verify.

Note: The Compatibility with Apple Silicon Macs section specifies whether your current and future app versions are compatible with Apple silicon Macs.

---

Fetch all the relevant info from https://developer.apple.com/help/app-store-connect/