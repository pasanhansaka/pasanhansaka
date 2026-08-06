import os
import re
import requests
from datetime import datetime, timezone

USERNAME = "pasanhansaka"
TOKEN = os.environ["GH_TOKEN"]
HEADERS = {"Authorization": f"Bearer {TOKEN}"}


def graphql(query, variables=None):
    r = requests.post(
        "https://api.github.com/graphql",
        json={"query": query, "variables": variables or {}},
        headers=HEADERS,
    )
    r.raise_for_status()
    data = r.json()
    if "errors" in data:
        raise RuntimeError(data["errors"])
    return data["data"]


def get_stats():
    query = """
    query($login: String!) {
      user(login: $login) {
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          totalCount
          nodes { stargazerCount }
        }
        followers { totalCount }
        following { totalCount }
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
          totalPullRequestContributions
          totalIssueContributions
        }
        repositoriesContributedTo(first: 1, contributions: [COMMIT]) {
          totalCount
        }
      }
    }
    """
    data = graphql(query, {"login": USERNAME})["user"]
    stars = sum(r["stargazerCount"] for r in data["repositories"]["nodes"])
    commits = (
        data["contributionsCollection"]["totalCommitContributions"]
        + data["contributionsCollection"]["restrictedContributionsCount"]
    )
    return {
        "repos": data["repositories"]["totalCount"],
        "contributed": data["repositoriesContributedTo"]["totalCount"],
        "stars": stars,
        "followers": data["followers"]["totalCount"],
        "following": data["following"]["totalCount"],
        "prs": data["contributionsCollection"]["totalPullRequestContributions"],
        "issues": data["contributionsCollection"]["totalIssueContributions"],
        "commits": commits,
    }


ASCII_ART = r"""
     ____                          
    |  _ \ __ _ ___  __ _ _ __     
    | |_) / _` / __|/ _` | '_ \    
    |  __/ (_| \__ \ (_| | | | |   
    |_|   \__,_|___/\__,_|_| |_|   
"""


def build_block(stats: dict) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return f"""```text
{ASCII_ART}
pasan@synapse -----------------------------
OS: ................. Windows 10, Ubuntu Linux
Role: ................ SE Intern @ Synapse Solutions
Degree: .............. BSc (Hons) SE — Birmingham City University
Stack: ............... Java, Spring Boot, React, MySQL, AngularJS

- GitHub Stats ----------------------------
Repos: ....... {stats['repos']}  {{Contributed: {stats['contributed']}}}
Stars: ....... {stats['stars']}   |  Followers: {stats['followers']}
Commits: ..... {stats['commits']}   |  PRs: {stats['prs']}   |  Issues: {stats['issues']}

Last synced: {now}
```"""


def update_readme():
    with open("README.md", "r", encoding="utf-8") as f:
        content = f.read()

    start = "<!--NEOFETCH:START-->"
    end = "<!--NEOFETCH:END-->"
    new_block = f"{start}\n{build_block(get_stats())}\n{end}"

    pattern = re.compile(f"{re.escape(start)}.*?{re.escape(end)}", re.DOTALL)
    if pattern.search(content):
        content = pattern.sub(new_block, content)
    else:
        raise RuntimeError("Markers not found in README.md — add them first.")

    with open("README.md", "w", encoding="utf-8") as f:
        f.write(content)


if __name__ == "__main__":
    update_readme()
