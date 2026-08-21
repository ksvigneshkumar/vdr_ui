export function validateWorkspaceForm(formData) {
    const errors = {};
    if (!formData.name || formData.name.trim() === "") {
        errors.name = "Workspace name is required.";
    } else if (formData.name.length > 50) {
        errors.name = "Workspace name must be less than 50 characters.";
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}
