"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
class MyComposerButton extends mailspring_exports_1.React.Component {
    constructor() {
        super(...arguments);
        this._onClick = () => {
            const { session, draft } = this.props;
            // To retrieve information about the draft, we fetch the current editing
            // session from the draft store. We can access attributes of the draft
            // and add changes to the session which will be appear immediately.
            // Note: the starter used electron's `remote.dialog` here, but `remote`
            // was removed in modern Electron (Mailspring 1.22+), so we just apply
            // the change directly.
            const newSubject = `${draft.subject} - It Worked!`;
            session.changes.add({ subject: newSubject });
        };
    }
    shouldComponentUpdate(nextProps) {
        // Our render method doesn't use the provided `draft`, and the draft changes
        // constantly (on every keystroke!) `shouldComponentUpdate` helps keep Mailspring fast.
        return nextProps.session !== this.props.session;
    }
    render() {
        return (mailspring_exports_1.React.createElement("div", { className: "my-package" },
            mailspring_exports_1.React.createElement("button", { className: "btn btn-toolbar", onClick: () => this._onClick(), ref: "button" }, "Hello World")));
    }
}
exports.default = MyComposerButton;
// Note: You should assign a new displayName to avoid naming
// conflicts when injecting your item
MyComposerButton.displayName = "MyComposerButton";
// When you register as a composer button, you receive a
// reference to the draft, and you can look it up to perform
// actions and retrieve data.
MyComposerButton.propTypes = {
    draft: mailspring_exports_1.PropTypes.object.isRequired,
    session: mailspring_exports_1.PropTypes.object.isRequired
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXktY29tcG9zZXItYnV0dG9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL215LWNvbXBvc2VyLWJ1dHRvbi5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyREFBc0Q7QUFFdEQsTUFBcUIsZ0JBQWlCLFNBQVEsMEJBQUssQ0FBQyxTQUFTO0lBQTdEOztRQW1CRSxhQUFRLEdBQUcsR0FBRyxFQUFFO1lBQ2QsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBRXRDLHdFQUF3RTtZQUN4RSxzRUFBc0U7WUFDdEUsbUVBQW1FO1lBQ25FLHVFQUF1RTtZQUN2RSxzRUFBc0U7WUFDdEUsdUJBQXVCO1lBQ3ZCLE1BQU0sVUFBVSxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sZUFBZSxDQUFDO1lBQ25ELE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDO0lBZUosQ0FBQztJQWhDQyxxQkFBcUIsQ0FBQyxTQUFTO1FBQzdCLDRFQUE0RTtRQUM1RSx1RkFBdUY7UUFDdkYsT0FBTyxTQUFTLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO0lBQ2xELENBQUM7SUFlRCxNQUFNO1FBQ0osT0FBTyxDQUNMLGtEQUFLLFNBQVMsRUFBQyxZQUFZO1lBQ3pCLHFEQUNFLFNBQVMsRUFBQyxpQkFBaUIsRUFDM0IsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFDOUIsR0FBRyxFQUFDLFFBQVEsa0JBR0wsQ0FDTCxDQUNQLENBQUM7SUFDSixDQUFDOztBQTVDSCxtQ0E2Q0M7QUE1Q0MsNERBQTREO0FBQzVELHFDQUFxQztBQUM5Qiw0QkFBVyxHQUFHLGtCQUFrQixDQUFDO0FBRXhDLHdEQUF3RDtBQUN4RCw0REFBNEQ7QUFDNUQsNkJBQTZCO0FBQ3RCLDBCQUFTLEdBQUc7SUFDakIsS0FBSyxFQUFFLDhCQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7SUFDbEMsT0FBTyxFQUFFLDhCQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7Q0FDckMsQ0FBQyJ9