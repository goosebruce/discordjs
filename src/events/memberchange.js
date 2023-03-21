const { Events } = require('discord.js');

module.exports = {
    name: Events.guildMemberUpdate,
    async execute(oldMember, newMember) {
        // Check if the new role is the 'Pro' role
        const proRole = newMember.roles.cache.find(role => role.name === 'Pro');
        const proGroupRoles = oldMember.roles.cache.filter(role => role.name.startsWith('Pro Group - '));
        const proGroupCount = proGroupRoles.size;
        if (proRole === undefined) {
            console.log(`users pro groups: ${proGroupRoles}`)
            if (proGroupRoles.size === 0) {
                // The member didn't have any "Pro Group -" roles, do nothing
                return;
            } else {
                newMember.roles.remove(proGroupRoles)
            }
        } else if (!oldMember.roles.cache.has(proRole.id) && newMember.roles.cache.has(proRole.id)) {
            // Get the category object
            const categoryId = '1077796703408762951';
            const category = newMember.guild.channels.cache.get(categoryId);
            // Get all roles in the server
            const roles = newMember.guild.roles.cache;
            // Filter roles that start with 'Pro Group -'
            const groupRoles = roles.filter(role => role.name.startsWith(config.pro_role_suffix));

            // Loop through each group role and count the number of members
            let assignedRole = null;
            groupRoles.forEach(role => {
                console.log(`${role.name} members: ${role.members.size}`)
                const memberCount = role.members.size;
                if (memberCount < config.max_pro_members_per_group && assignedRole === null) {
                    // If the group has less than 5 members and a role hasn't been assigned yet, assign the new member to this group
                    assignedRole = role;
                    console.log(`assigning role ${assignedRole.name}`)
                } else {
                    console.log(`${role.name} Group full`)
                }
            });

            if (assignedRole === null) {
                // If all groups have 5 members, create a new role and assign it to the new member
                const newRoleName = `config.pro_role_suffix${groupRoles.size + 1}`;
                console.log(`creating new role: ${newRoleName}`)
                try {
                    const newRole = await newMember.guild.roles.create({
                        name: newRoleName,
                        color: 'RANDOM',
                        reason: 'New pro group role created',
                    });
                    newMember.roles.add(newRole);
                    // Create a new channel under the specified category
                    const channel = await newMember.guild.channels.create(`config.pro_channel_suffix${newRole.name}`, {
                        type: 'text',
                        parent: category,
                        permissionOverwrites: [
                            {
                                id: newMember.guild.id,
                                deny: ['VIEW_CHANNEL'],
                            },
                            {
                                id: newRole.id,
                                allow: ['VIEW_CHANNEL'],
                            },
                        ],
                    });
                    console.log(`New channel created: ${channel.name}`);
                } catch (error) {
                    console.error('Error creating new group role:', error);
                }
            } else {
                // If there is an available group with less than 5 members, assign the new member to this group
                newMember.roles.add(assignedRole);
                console.log(`user added to existing group: ${assignedRole.name}`);
            }
        }
    }
};