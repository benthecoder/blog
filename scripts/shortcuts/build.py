import plistlib, uuid

ASK = str(uuid.uuid4()).upper()
POST = str(uuid.uuid4()).upper()
TOKEN = str(uuid.uuid4()).upper()

wf = {
    "WFWorkflowClientVersion": "2900",
    "WFWorkflowMinimumClientVersion": 900,
    "WFWorkflowMinimumClientVersionString": "900",
    "WFWorkflowIcon": {"WFWorkflowIconStartColor": 4282601983, "WFWorkflowIconGlyphNumber": 59511},
    # Asked on install; the token is never stored in this file. Targets the
    # gettext action (index 0) so no dictionary-item targeting is needed.
    "WFWorkflowImportQuestions": [
        {"ActionIndex": 0, "Category": "Parameter", "DefaultValue": "",
         "ParameterKey": "WFTextActionText",
         "Text": "Paste your TWEET_TOKEN (posting-only token)"}],
    "WFWorkflowTypes": ["ActionExtension", "NCWidget", "Watch"],
    "WFWorkflowInputContentItemClasses": [
        "WFURLContentItem", "WFSafariWebPageContentItem", "WFStringContentItem"],
    "WFWorkflowActions": [
        {"WFWorkflowActionIdentifier": "is.workflow.actions.gettext",
         "WFWorkflowActionParameters": {
             "UUID": TOKEN, "CustomOutputName": "token", "WFTextActionText": ""}},
        {"WFWorkflowActionIdentifier": "is.workflow.actions.ask",
         "WFWorkflowActionParameters": {
             "UUID": ASK, "CustomOutputName": "take",
             "WFAskActionPrompt": "take?", "WFInputType": "Text"}},
        {"WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
         "WFWorkflowActionParameters": {
             "UUID": POST,
             "WFURL": "https://bneo.xyz/api/tweet",
             "WFHTTPMethod": "POST",
             "WFHTTPHeaders": {"Value": {"WFDictionaryFieldValueItems": [
                 {"WFItemType": 0,
                  "WFKey": {"Value": {"string": "Authorization"}, "WFSerializationType": "WFTextTokenString"},
                  "WFValue": {"Value": {"string": "Bearer ￼", "attachmentsByRange": {"{7, 1}": {"Type": "ActionOutput", "OutputName": "token", "OutputUUID": TOKEN}}},
                              "WFSerializationType": "WFTextTokenString"}},
             ]}, "WFSerializationType": "WFDictionaryFieldValue"},
             "WFHTTPBodyType": "JSON",
             "WFJSONValues": {"Value": {"WFDictionaryFieldValueItems": [
                 {"WFItemType": 0,
                  "WFKey": {"Value": {"string": "link"}, "WFSerializationType": "WFTextTokenString"},
                  "WFValue": {"Value": {"string": "￼", "attachmentsByRange": {"{0, 1}": {"Type": "ExtensionInput"}}},
                              "WFSerializationType": "WFTextTokenString"}},
                 {"WFItemType": 0,
                  "WFKey": {"Value": {"string": "body"}, "WFSerializationType": "WFTextTokenString"},
                  "WFValue": {"Value": {"string": "￼", "attachmentsByRange": {"{0, 1}": {"Type": "ActionOutput", "OutputName": "take", "OutputUUID": ASK}}},
                              "WFSerializationType": "WFTextTokenString"}},
             ]}, "WFSerializationType": "WFDictionaryFieldValue"}}},
        {"WFWorkflowActionIdentifier": "is.workflow.actions.showresult",
         "WFWorkflowActionParameters": {"Text": "posted"}},
    ],
}
with open("tweet.unsigned.shortcut", "wb") as f:
    plistlib.dump(wf, f, fmt=plistlib.FMT_BINARY)
