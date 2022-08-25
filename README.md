# ttarchive
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
## Description
A content backup/archiver and offline viewing app for TikTok.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)
- [Contributing](#contributing)
- [Tests](#tests)
- [Questions](#questions)
## Installation
   - Create the config file.
      - The config file is ~/.config/ttarchive/ttarhive.config. Create it if it doesn't exist.
      - Specify the directory to be used as the main archive. This is set in the config file as the variable `ttarchiveOutput`.
      - Example config: `ttarchive=/home/user/ttarchive`
   - Run `sh install.sh`

## Usage
The application currently takes a single `.html` downloaded from the TikTok webapp page for a user. The filename must contain (@username). It then downloads the videos and associated metadata using `yt-dlp`. Finally, in generates html pages for each user and a homepage for easier organization and viewing.

## License
This project is licensed under the GPLv3 license.
Learn more about the license [here](https://www.gnu.org/licenses/gpl-3.0).
## Contributing
Tackle outstanding issues and submit a pull request to develop.

## Tests
## Questions
GitHub: [snowlune](https://github.com/snowlune)

For questions and feedback, please email: [snowluna@protonmail.com](mailto:snowluna@protonmail.com)
