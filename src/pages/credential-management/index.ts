import * as vscode from "vscode";
import { setPanelIcon, updateWebview } from "../../common";
import * as core from "@serverless-devs/core";
import {
  deleteCredentialByAccess,
  getCredentialWithAll,
} from "../../common/credential";
const { lodash: _ } = core;
let credentialWebviewPanel: vscode.WebviewPanel | undefined;

export async function activeCredentialWebviewPanel(
  context: vscode.ExtensionContext
) {
  if (credentialWebviewPanel) {
    credentialWebviewPanel.reveal();
  } else {
    credentialWebviewPanel = vscode.window.createWebviewPanel(
      "Serverless-Devs",
      "Add credential - Serverless-Devs",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    await updateWebview(
      credentialWebviewPanel,
      "credential-management",
      context,
      {
        items: core.CONFIG_PROVIDERS,
        configAccessList: core.CONFIG_ACCESS,
        data: await getCredentialWithAll(),
      }
    );
    await setPanelIcon(credentialWebviewPanel);
    credentialWebviewPanel.onDidDispose(
      () => {
        credentialWebviewPanel = undefined;
      },
      null,
      context.subscriptions
    );
    credentialWebviewPanel.webview.onDidReceiveMessage(
      (message) => {
        handleMessage(context, message);
      },
      undefined,
      context.subscriptions
    );
  }
}

async function handleMessage(context: vscode.ExtensionContext, message: any) {
  switch (message.command) {
    case "getCredential":
      const data = await getCredentialWithAll();
      credentialWebviewPanel.webview.postMessage({
        data: data,
      });
      break;
    case "deleteCredential":
      try {
        const res = await vscode.window.showInformationMessage(
          `Are you sure to delete ${message.alias} configuration?`,
          "yes",
          "no"
        );
        if (res === "yes") {
          await deleteCredentialByAccess(message.alias);
          updateWebview(
            credentialWebviewPanel,
            "credential-management",
            context,
            {
              items: core.CONFIG_PROVIDERS,
              configAccessList: core.CONFIG_ACCESS,
              data: await getCredentialWithAll(),
            }
          );
        }
      } catch (e) {
        vscode.window.showInformationMessage(
          `Delete ${message.alias} configuration failed.${e.message}`
        );
      }
      break;
    case "setCredential":
      const { ...rest } = message.kvPairs;
      if (message.provider === "alibaba") {
        try {
          const accountId = await core.getAccountId(message.kvPairs);
          rest["AccountID"] = accountId["AccountId"];
        } catch (e) {
          vscode.window.showErrorMessage(`Unable to obtain AccountID,
            please check the input you entered.`);
          return;
        }
      }
      await core.setKnownCredential(rest, message.alias);
      vscode.window.showInformationMessage(
        `Add ${message.alias} configuration successfully.`
      );
      updateWebview(credentialWebviewPanel, "credential-management", context, {
        items: core.CONFIG_PROVIDERS,
        configAccessList: core.CONFIG_ACCESS,
        data: await getCredentialWithAll(),
      });
  }
}
