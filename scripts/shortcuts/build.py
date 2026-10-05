import plistlib, uuid

ASK = str(uuid.uuid4()).upper()
POST = str(uuid.uuid4()).upper()

def var_input():  # Shortcut Input (share sheet)
    return {"Value": {"Type": "ExtensionInput"}, "WFSerializationType": "WFTextTokenAttachment"}

def var_action(name, uid):
    return {"Value": {"Type": "ActionOutput", "OutputName": name, "OutputUUID": uid},
            "WFSerializationType": "WFTextTokenAttachment"}

def item(key, value):
    return {"WFItemType": 0,
            "WFKey": {"Value": {"string": key}, "WFSerializationType": "WFTextTokenString"},
            "WFValue": {"Value": value, "WFSerializationType": "WFTextTokenAttachment"}}

wf = {
    "WFWorkflowClientVersion": "2900",
    "WFWorkflowMinimumClientVersion": 900,
    "WFWorkflowMinimumClientVersionString": "900",
    "WFWorkflowIcon": {"WFWorkflowIconStartColor": 4282601983, "WFWorkflowIconGlyphNumber": 59511},
    "WFWorkflowImportQuestions": [],
    "WFWorkflowTypes": ["ActionExtension", "NCWidget", "Watch"],
    "WFWorkflowInputContentItemClasses": [
        "WFURLContentItem", "WFSafariWebPageContentItem", "WFStringContentItem"],
    "WFWorkflowActions": [
        {"WFWorkflowActionIdentifier": "is.workflow.actions.ask",
         "WFWorkflowActionParameters": {
             "UUID": ASK, "CustomOutputName": "take",
             "WFAskActionPrompt": "take?", "WFInputType": "Text"}},
        {"WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
         "WFWorkflowActionParameters": {
             "UUID": POST,
             "WFURL": "https://bneo.xyz/api/tweet",
             "WFHTTPMethod": "POST",
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
