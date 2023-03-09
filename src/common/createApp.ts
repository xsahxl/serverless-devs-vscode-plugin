import * as vscode from "vscode";
import { init } from "../commands/init";
import * as core from "@serverless-devs/core";
import { activeApplicationWebviewPanel } from "../pages/registry";
const { lodash: _, generateRandom } = core;
const fetch = require("node-fetch");
import localize from "../localize";
var qs = require("qs");

export const attrList = {
  category: {
    url: "https://registry.devsapp.cn/common/category",
    id: "categorylist",
  },
  provider: {
    url: "https://registry.devsapp.cn/common/provider",
    id: "providerlist",
  },
  application: {
    url: "https://registry.devsapp.cn/package/search",
    id: "applicationlist",
  },
  params: {
    url: "https://registry.devsapp.cn/package/param",
    id: "appParams",
  },
};

export async function pickCreateMethod(context: vscode.ExtensionContext) {
  const result = await vscode.window.showQuickPick(
    [
      {
        label: localize("vscode.template"),
        value: "template",
      },
      {
        label: "Registry",
        value: "registry",
      },
    ],
    {
      placeHolder: localize("vscode.how.do.you.want.to.create.your.app"),
    }
  );

  if (result.value === "template") {
    await init(context);
  } else if (result.value === "registry") {
    activeApplicationWebviewPanel(context);
  }
}

export async function setInitPath() {
  const options: vscode.OpenDialogOptions = {
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: localize("vscode.select.this.path"),
    defaultUri: vscode.Uri.file(
      core.getRootHome().slice(0, core.getRootHome().lastIndexOf("/"))
    ),
  };
  const selectFolderUri = await vscode.window.showOpenDialog(options);
  if (selectFolderUri) {
    return selectFolderUri[0];
  }
}

export function replaceDefaultConfig(config: any) {
  for (let i in config["properties"]) {
    if (
      config["properties"][i].hasOwnProperty("default") &&
      _.endsWith(config["properties"][i]["default"], "${default-suffix}")
    ) {
      config["properties"][i]["default"] = _.replace(
        config["properties"][i]["default"],
        "${default-suffix}",
        generateRandom()
      );
    }
  }
  return config;
}

export async function responseData(panel: vscode.WebviewPanel, sort: string) {
  const categoryFetch = await fetch(attrList["category"]["url"]);
  const applicationFetch = await fetch(attrList["application"]["url"], {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: qs.stringify({ type: "Application", sort: sort }),
  });
  panel.webview.postMessage({
    command: "responseData",
    categoryList: await categoryFetch.json(),
    applicationList: await applicationFetch.json(),
    aliasList: await core.getCredentialAliasList(),
  });
}

export async function initProject(
  panel: vscode.WebviewPanel,
  config: any
): Promise<string> | undefined {
  try {
    const appPath: string = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
      },
      async (progress, token) => {
        progress.report({
          message: `Downloading: ${config.source}...`,
        });
        const appPath = await core.loadApplication(config);
        progress.report({
          message: `Downloaded: ${config.source}`,
        });
        return appPath;
      }
    );
    const newWindow = !!vscode.workspace.rootPath;
    if (newWindow) {
      panel.dispose();
    }
    vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(appPath),
      newWindow
    );
    return appPath;
  } catch (e) {
    vscode.window.showErrorMessage(e.message);
  }
}
