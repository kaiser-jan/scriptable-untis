# Untis Widget for Scriptable

iOS Widgets for [Untis](https://webuntis.com/) using [Scriptable](https://scriptable.app/) to display important information about school life directly on the homescreen.

<img src="assets/WidgetSmall.png" alt="Small widget showing upcoming lessons" width="256px">
<img src="assets/WidgetMedium.png" alt="Medium widget showing upcoming lessons (including cancelled lessons), the next exams and recent grades" width="512px">

## ❔ What is this for?

Untis is a service used by many students (mainly in Austria and Germany) to keep track of their school-life, especially for checking the timetable.
There is a mobile app, but it does not provide any widgets, at least on iOS.
That's why I decided to create those widgets myself, so I can have the most important information directly on my homescreen.
It also notifies me about the most important changes.

## ✨ Features

The script allows you to display data for one WebUntis account in a widget, and will notify you about important changes.\
You can set what information (views) should be displayed for each widget.\
To safe battery and bandwidth, the data is updated at the start of every lesson and every few hours outside of school-hours.\
The fetched data is cached for some time, so the script takes less time, bandwidth and battery to run.\
Many things can be configured via the visual config editor or the configuration file `untis-config.json` in the scriptable folder, check the [configuration section](#⚒️-configuration) for details.

### 🔔 Notifications

You will be notified about the following changes/events:

-   Lessons (canceled, shifted, teacher changed, ...)
-   Exams (upcoming)
-   Grades (added)
-   Absences (added)

Please understand that the notifications can only be sent as soon as the script runs the next time.

### 🪟 Views

#### Lessons

Shows the upcoming lessons, meaning their subject, when they begin and some special information.
Lessons can be colored, and if there is enough space, the long subject-names and end-times are displayed.
After a school day has ended, a summary of the next day is displayed. (list of subjects)

#### Exams

Shows the upcoming exams, meaning their subject and date.
By default, exams are colored according to the subject configuration. The widget displays as much information as fits.
You can configure how many days ahead the exams should be displayed and set a maximum count.

#### Grades

Displays the recent grades you received. (subject + mark)
By default, grades are colored according to the subject configuration. The widget displays as much information as fits.
You can configure how long grades should be displayed and set a maximum count.

#### Absences

Lists open (unexcused) absences with their date and duration. It also shows who created the absence, if there is enough space.

## 📥 Installation

1. Before installing the script, you need to [install Scriptable from the App Store](https://apps.apple.com/us/app/scriptable/id1405459188?uo=4).

2. To install the script, head over to the [releases page](https://github.com/JFK-05/scriptable-untis/releases) select the latest release.\
   Alternatively, you can directly download the latest stable release [here](https://github.com/JFK-05/scriptable-untis/releases/latest/download/UntisWidget.js).

3. After downloading the file, click share, and select scriptable.
   Now click `Add to My Scripts` at the bottom.

4. Click the play button at the lower right (or click the script in the overview) to run the script. This will start the setup process.\
   You will be asked for the url, which you can find when selecting you school [here](https://webuntis.com/). You might have to click the "switch school" button to get to the correct page.\
   The url should look something like this: `https://<server>.webuntis.com/WebUntis/?school=<schoolname>#/basic/login`. (with `<server>` and `<schoolname>` replaced)

5. Now you can add an iOS widget for Scriptable and select the script in the options.

6. The widget should update automatically and display the information. 🥳 (might take a few seconds)

7. If you want to customize the widget (e.g. color the lessons), see the [configuration section](#⚒️-configuration).

## ⏫ Updating

The script will check for updates every few hours.\
Regular updates will be downloaded and installed automatically.\
If you want to update manually, you can do so by running the script and selecting `🔄 Update Script` in the menu.\
When there is a breaking change, you will be notified and asked to update manually.\
Check the [releases page](https://github.com/JFK-05/scriptable-untis/releases) for more information about the changes.

## ⚒️ Configuration

When long-pressing the widget, you see the iOS widget configuration.
In the `Parameter` field, you can enter the configuration for the widget.
The configuration is a list of the views you want to be displayed, separated by a comma.\
For larger widgets, you can create multiple columns by separating the views with a pipe (`|`).\
Example: `lessons,exams` or `lessons|exams,grades,absences`

### ⚙️ Settings Editor

The config editor is a UI utility, so you don't have to deal with the configuration file directly.\
You can open it by running the script and selecting `⚙️ Open Settings` in the menu.\
It will open up a list with settings categories. The top row shows you where you are in the menu, below there are the categories and settings.\
Clicking a category will open it, clicking a setting will open a dialog to edit it.\
If you change a value, the default will be displayed below it in gray.\
You can use the `↩️` button to reset a setting to its default value.

#### 📚 Subjects Config

The subjects config allows you to configure e.g. the colors of the lessons.\
It is accessible in the config editor under `📚 Subjects Config`.\
You will now see a list of all subjects you have configurations for, listed by their short name. (might be empty)\
You can delete a subject config by clicking the trash emoji (🗑️).

By clicking a subject, you can open its specific configuration.

Here are the configuration options:

-   `color`: The color of the lesson. You can either enter a hex code (like `#ff0000`) at the top, or select one from the palette.
    To find the perfect color, you can use [this website](https://htmlcolorcodes.com/color-picker/).
    Darker, less saturated colors are recommended, as this makes it easier to read the white text on the background.
-   `short name`: The short name of the subject to display.
-   `long name`: The name of the subject to display if there is enough space (and the option is enabled).
-   `ignore infos`: A list of lesson infos to ignore. This can be useful if there is lesson info which is always there.
    This should be a comma-separated list of the infos to ignore, wrapped in double quotes. (`"infoName"` or `"info1", "info2"`)

##### Adding a new subject

At the top you can add a new subject configuration. You will have to enter the `short subject name` (the one displayed in webuntis.)\
If you want to only apply the configuration when a specific teacher is teaching the subject, you can enter the `teacher` name as well.
This can be helpful when there are subjects which are combined in WebUntis.

##### 🧑‍🏫 Teacher specific configs

Some subjects may be combined in Untis. For example, geography and history may be combined.\
In the teachers section of a subject, you can create configs for specific teachers.\
When this teachers now teaches this subject, the configuration of the teacher will override the one from the subject.

### 📄 Config File

The configuration file `untis-config.json` is located in the scriptable folder.\
A default configuration file is created when the script is run for the first time. Check it out to see what's possible!\
Changes to the configuration file are applied when the script is run again.

## 🧑‍💻 Notes for Developers

### 📦 Bundling

For quite some time, all the code was in one file.\
I was aware of how unpleasant this is and always wanted to split it up.\
But I thought that this would kind of defeat the point of scriptable, since a bundled file is not really as readable.\
In the end I decided to still split it, as this makes the source code way easier to read and maintain.
I tried to bundle it using [webpack](https://webpack.js.org/), but ran into some problems: The emitted code would not await the result, therefore Scriptable exited before the code was executed.\
That's why I switched to [rollup](https://rollupjs.org/), which worked perfectly. The emitted code even is quite readable now, nearly as much as if it was written directly in javascript.

### ⚙️ Config Editor

The config editor is a handy utility which makes the widget easier to use for people, who are not into editing config files.\
But of the limitations of scriptable, and as the implementation had to be quite generalizable, the code is a little complex.\
I am quite happy with the result, even though it has a few flaws, which I might address in the future.

### 📖 Documentation

Currently there seems to be an issue with github (similar to [this one](https://github.com/thlorenz/anchor-markdown-header/issues/36)), where emojis in titles break header links.\
Therefore the header anchors in this readme may not work.
