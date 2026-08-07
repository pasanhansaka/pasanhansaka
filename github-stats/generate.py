import os
import requests
from datetime import datetime, timezone
from lxml import etree

USERNAME = "pasanhansaka"
TOKEN = os.environ["GH_TOKEN"]
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
SVG_FILE = "neofetch.svg"


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
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
          totalPullRequestContributions
          totalIssueContributions
        }
        repositoriesContributedTo(first: 1, contributionTypes: [COMMIT]) {
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
        "repo_data": data["repositories"]["totalCount"],
        "contrib_data": data["repositoriesContributedTo"]["totalCount"],
        "star_data": stars,
        "follower_data": data["followers"]["totalCount"],
        "commit_data": commits,
        "pr_data": data["contributionsCollection"]["totalPullRequestContributions"],
        "issue_data": data["contributionsCollection"]["totalIssueContributions"],
        "synced_data": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    }


def find_and_replace(root, element_id, new_text):
    element = root.find(f".//*[@id='{element_id}']")
    if element is not None:
        element.text = str(new_text)


def justify_format(root, element_id, new_text, length=0):
    if isinstance(new_text, int):
        new_text = f"{new_text:,}"
    new_text = str(new_text)
    find_and_replace(root, element_id, new_text)
    just_len = max(0, length - len(new_text))
    dot_string = ' ' + ('.' * just_len) + ' ' if just_len > 0 else ' '
    find_and_replace(root, f"{element_id}_dots", dot_string)


def update_svg(stats):
    tree = etree.parse(SVG_FILE)
    root = tree.getroot()

    justify_format(root, "repo_data", stats["repo_data"], 6)
    justify_format(root, "contrib_data", stats["contrib_data"])
    justify_format(root, "star_data", stats["star_data"], 4)
    justify_format(root, "commit_data", stats["commit_data"], 20)
    justify_format(root, "follower_data", stats["follower_data"], 4)
    justify_format(root, "pr_data", stats["pr_data"], 25)
    justify_format(root, "issue_data", stats["issue_data"], 7)
    justify_format(root, "synced_data", stats["synced_data"], 14)

    tree.write(SVG_FILE, encoding="utf-8", xml_declaration=True)


if __name__ == "__main__":
    update_svg(get_stats())
