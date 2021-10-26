import {
  eachRoot,
  findCommentsInRaws,
  namespace,
  optionsHaveIgnored
} from "../../utils";
import { utils } from "stylelint";

export const ruleName = namespace("double-slash-comment-inline");

export const messages = utils.ruleMessages(ruleName, {
  expected: "Expected //-comment to be inline comment",
  rejected: "Unexpected inline //-comment"
});

const stylelintCommandPrefix = "stylelint-";

export default function(expectation, options) {
  return (root, result) => {
    const validOptions = utils.validateOptions(
      result,
      ruleName,
      {
        actual: expectation,
        possible: ["always", "never"]
      },
      {
        actual: options,
        possible: {
          ignore: ["stylelint-commands"]
        },
        optional: true
      }
    );

    if (!validOptions) {
      return;
    }

    eachRoot(root, checkRoot);

    function checkRoot(root) {
      const rootString = root.source.input.css;

      if (rootString.trim() === "") {
        return;
      }

      const comments = findCommentsInRaws(rootString);

      for (const comment of comments) {
        // Only process // comments
        if (comment.type !== "double-slash") {
          continue;
        }

        // Optionally ignore stylelint commands
        if (
          comment.text &&
          comment.text.startsWith(stylelintCommandPrefix) &&
          optionsHaveIgnored(options, "stylelint-commands")
        ) {
          continue;
        }

        const isInline = comment.inlineAfter || comment.inlineBefore;
        let message;

        if (isInline && expectation === "never") {
          message = messages.rejected;
        } else if (!isInline && expectation === "always") {
          message = messages.expected;
        } else {
          continue;
        }

        utils.report({
          message,
          node: root,
          index: comment.source.start,
          result,
          ruleName
        });
      }
    }
  };
}
