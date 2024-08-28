export class TravelerModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            subType: new fields.StringField({required: true, default: "passenger"}),
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
        const roleDetails = pf1.registry.travelerRoles.get(this.subType) ?? {};

        const recurseAttach = (obj, details) => {
            Object.entries(details).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    if (!obj[key]) {
                        obj[key] = [];
                    }
                    obj[key].push(...value);
                } else if (typeof value === "object") {
                    if (!obj[key]) {
                        obj[key] = {};
                    }
                    recurseAttach(obj[key], value);
                } else {
                    obj[key] = value;
                }
            });
        }
        recurseAttach(this, roleDetails);

        if (roleDetails.tasks?.length) {
            if(!this.details.task) {
                this.details.task = roleDetails.tasks[0].id;
            }

            let task = null;
            for (const taskDetails of roleDetails.tasks || []) {
                if (taskDetails.id === this.details.task) {
                    task = taskDetails;
                    break;
                }
            }

            if (task) {
                this.taskName = task.name;
                recurseAttach(this, {
                    changes: task.changes,
                    contextNotes: task.contextNotes,
                })
            }
        }
    }
}