import {CaravanItemModel} from "./caravan-item-model.js";

export class TravelerModel extends CaravanItemModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            subType: new fields.StringField({required: true, default: "passenger"}),
            monthlyWage: new fields.NumberField({required: false, default: 0}),
            details: new fields.SchemaField({
                description: new fields.SchemaField({
                    value: new fields.StringField({required: true, default: ""}),
                }),
                task: new fields.StringField(),
                isHero: new fields.BooleanField({required: true, default: false}),
            })
        };
    }

    prepareDerivedData() {
        this._mergeRoleDetails();
    }

    _mergeRoleDetails() {
        if(this.roleDetailsMerged) {
            return;
        }
        this.roleDetailsMerged = true;

        const roleDetails = pf1.registry.travelerRoles.get(this.subType) ?? {};
        this._recurseAttach(this, roleDetails);

        if (roleDetails.tasks?.length) {
            if (!this.details.task) {
                this.details.task = roleDetails.tasks[0].id;
            }

            let task = null;
            for (const taskDetails of roleDetails.tasks || []) {
                if (taskDetails.id === this.details.task) {
                    task = taskDetails;
                    break;
                }
            }

            if (!task) {
                this.details.task = roleDetails.tasks[0].id;
                task = roleDetails.tasks[0];
            }

            this.taskName = task.name;
            this._recurseAttach(this, {
                changes: task.changes,
                contextNotes: task.contextNotes,
            })
        }
    }
}