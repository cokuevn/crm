# Добавить этот endpoint в server.py

"""
@api_router.post("/users/ensure-organization")
async def ensure_user_organization(current_user: str = Depends(get_current_user)):
    '''
    Убедиться что у пользователя есть организация
    Если нет - создать автоматически (для владельцев)
    Если пользователь - менеджер, ничего не создавать
    '''
    
    # Получить пользователя
    user = await db.users.find_one({"uid": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Проверить, есть ли членство в организациях
    existing_membership = await db.organization_members.find_one({
        "user_id": current_user,
        "is_active": True
    })
    
    # Если уже есть членство - вернуть информацию об организации
    if existing_membership:
        org = await db.organizations.find_one({"id": existing_membership["organization_id"]})
        return {
            "organization": mongo_to_dict(org),
            "role": existing_membership.get("role"),
            "already_exists": True
        }
    
    # Проверить приглашение по email
    email = user.get("email")
    if email:
        invitation = await db.organization_members.find_one({
            "metadata.invited_email": email,
            "is_active": True
        })
        
        if invitation:
            # Обновить приглашение, связав с user_id
            await db.organization_members.update_one(
                {"id": invitation["id"]},
                {
                    "$set": {
                        "user_id": current_user,
                        "metadata.invitation_pending": False
                    }
                }
            )
            
            org = await db.organizations.find_one({"id": invitation["organization_id"]})
            return {
                "organization": mongo_to_dict(org),
                "role": invitation.get("role"),
                "already_exists": False,
                "invited": True
            }
    
    # Если нет членства и нет приглашения - создать новую организацию
    # (только для обычных пользователей, не менеджеров)
    
    org_name = f"Организация {user.get('display_name', user.get('email', current_user))}"
    
    org_obj = Organization(
        name=org_name,
        owner_id=current_user,
        settings=OrganizationSettings(
            timezone="Asia/Bishkek",
            currency="KGS",
            allow_negative_balance=True,
            features={"tasks": True, "analytics": True}
        )
    )
    
    await db.organizations.insert_one(org_obj.dict())
    
    # Создать членство с ролью owner
    member = OrganizationMember(
        organization_id=org_obj.id,
        user_id=current_user,
        role=MemberRole.owner,
        permissions=["*"],
        created_by=current_user
    )
    
    await db.organization_members.insert_one(member.dict())
    
    return {
        "organization": org_obj.dict(),
        "role": "owner",
        "already_exists": False,
        "created": True
    }
"""

