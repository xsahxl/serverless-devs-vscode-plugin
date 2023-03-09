import * as vscode from "vscode";
import * as path from "path";
import * as core from "@serverless-devs/core";
import * as fs from "fs";
import { ext } from "../../extensionVariables";
import localize from "../../localize";
import { TEMPLTE_FILE } from "../../constants";
const { lodash: _ } = core;

export async function markYaml(uri: vscode.Uri) {
  const { fsPath } = uri;
  try {
    // 方法执行成功说明yaml文件符合devs规范
    await core.transforYamlPath(fsPath);
    const answer = await vscode.window.showInputBox({
      title: localize("vscode.the.alias.for.this.workspace.configuration"),
      prompt: localize("vscode.please.enter"),
      validateInput: (name: string) => {
        return name.length === 0 ? "value cannot be empty." : undefined;
      },
    });
    if (_.isEmpty(answer)) return;
    const filePath = path.join(ext.cwd, TEMPLTE_FILE);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const relativePath = path.relative(ext.cwd, fsPath);

    if (!Array.isArray(data["marked-yamls"])) {
      data["marked-yamls"] = [
        {
          path: relativePath,
          alias: answer,
        },
      ];
    } else {
      const findObj = data["marked-yamls"].find(
        (item) => item.path === relativePath
      );
      if (findObj) {
        data["marked-yamls"] = data["marked-yamls"].map((item) => {
          if (item.path === relativePath) {
            item.alias = answer;
          }
          return item;
        });
      } else {
        data["marked-yamls"].push({
          path: relativePath,
          alias: answer,
        });
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    ext.localResource.refresh();
  } catch (error) {
    vscode.window.showErrorMessage(
      localize(
        "vscode.yaml.files.do.not.conform.to.the.Serverless.Devs.specification"
      )
    );
  }
}
