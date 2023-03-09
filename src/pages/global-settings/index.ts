import * as vscode from "vscode";
import { getHtmlForWebview, setPanelIcon } from "../../common";
import * as event from "./event";
import * as core from "@serverless-devs/core";
import localize from "../../localize";

let globalSettingsWebviewPanel: vscode.WebviewPanel | undefined;
export async function activeGlobalSettingsWebview(
  context: vscode.ExtensionContext
) {
  if (globalSettingsWebviewPanel) {
    globalSettingsWebviewPanel.reveal();
  } else {
    globalSettingsWebviewPanel = vscode.window.createWebviewPanel(
      "Serverless-Devs",
      "Set up - Serverless-Devs",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    async function updateWebview() {
      const analysis = await core.getSetConfig("analysis");
      globalSettingsWebviewPanel.webview.html = getHtmlForWebview(
        "global-settings",
        context,
        globalSettingsWebviewPanel.webview,
        {
          analysis,
          workspace: core.getRootHome(),
        }
      );
    }
    await updateWebview();
    await setPanelIcon(globalSettingsWebviewPanel);
    globalSettingsWebviewPanel.webview.onDidReceiveMessage(
      (val) => handleMessage(val, updateWebview),
      undefined,
      context.subscriptions
    );
    globalSettingsWebviewPanel.onDidDispose(
      () => {
        globalSettingsWebviewPanel = undefined;
      },
      null,
      context.subscriptions
    );
  }
}

async function handleMessage(
  params: { type: string; [key: string]: any },
  updateWebview: () => Promise<void>
) {
  switch (params.type) {
    case "analysis":
      await event.analysis(params);
      return;
    case "resetWorkspace":
      await event.resetWorkspace();
      await updateWebview();
      return;
    case "manageWorkspace":
      await event.mangeWorkspace();
      await updateWebview();
      return;
  }
}
