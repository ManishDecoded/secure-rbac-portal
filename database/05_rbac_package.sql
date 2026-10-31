CREATE OR REPLACE PACKAGE RBAC_PACKAGE AS

    PROCEDURE REGISTER_USER (
        p_full_name IN VARCHAR2,
        p_email IN VARCHAR2,
        p_password_hash IN VARCHAR2,
        p_role_name IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_account_status OUT VARCHAR2
    );

    PROCEDURE GET_USER_FOR_LOGIN (
        p_email IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_full_name OUT VARCHAR2,
        p_password_hash OUT VARCHAR2,
        p_role_name OUT VARCHAR2,
        p_account_status OUT VARCHAR2,
        p_found OUT NUMBER
    );

    PROCEDURE APPROVE_USER (
        p_admin_user_id IN NUMBER,
        p_target_user_id IN NUMBER,
        p_action IN VARCHAR2,
        p_message OUT VARCHAR2
    );

    PROCEDURE LIST_PENDING_USERS (
        p_users OUT SYS_REFCURSOR
    );

    PROCEDURE HAS_PERMISSION (
        p_user_id IN NUMBER,
        p_permission_key IN VARCHAR2,
        p_allowed OUT NUMBER
    );

END RBAC_PACKAGE;
/
CREATE OR REPLACE PACKAGE BODY RBAC_PACKAGE AS


    -- 1. REGISTER USER
    PROCEDURE REGISTER_USER (
        p_full_name IN VARCHAR2,
        p_email IN VARCHAR2,
        p_password_hash IN VARCHAR2,
        p_role_name IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_account_status OUT VARCHAR2
    )
    AS
        v_role_id NUMBER;
        v_role_name VARCHAR2(20);
    BEGIN

        IF TRIM(p_full_name) IS NULL
           OR TRIM(p_email) IS NULL
           OR TRIM(p_password_hash) IS NULL THEN
            RAISE_APPLICATION_ERROR(
                -20001, 'All registration fields are required.'
            );
        END IF;

        v_role_name := UPPER(TRIM(p_role_name));

        IF v_role_name NOT IN ('HR', 'MANAGER', 'EMPLOYEE') THEN
            RAISE_APPLICATION_ERROR(
                -20002, 'Invalid registration role.'
            );
        END IF;

        SELECT ROLE_ID
        INTO v_role_id
        FROM APP_ROLES
        WHERE ROLE_NAME = v_role_name;

        INSERT INTO APP_USERS (
            FULL_NAME,
            EMAIL,
            PASSWORD_HASH,
            ROLE_ID,
            ACCOUNT_STATUS
        )
        VALUES (
            TRIM(p_full_name),
            LOWER(TRIM(p_email)),
            p_password_hash,
            v_role_id,
            'PENDING'
        )
        RETURNING USER_ID INTO p_user_id;

        p_account_status := 'PENDING';

    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(
                -20003, 'This email is already registered.'
            );
    END REGISTER_USER;



    -- 2. GET USER FOR LOGIN
    PROCEDURE GET_USER_FOR_LOGIN (
        p_email IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_full_name OUT VARCHAR2,
        p_password_hash OUT VARCHAR2,
        p_role_name OUT VARCHAR2,
        p_account_status OUT VARCHAR2,
        p_found OUT NUMBER
    )
    AS
    BEGIN

        SELECT
            u.USER_ID,
            u.FULL_NAME,
            u.PASSWORD_HASH,
            r.ROLE_NAME,
            u.ACCOUNT_STATUS
        INTO
            p_user_id,
            p_full_name,
            p_password_hash,
            p_role_name,
            p_account_status
        FROM APP_USERS u
        JOIN APP_ROLES r
            ON u.ROLE_ID = r.ROLE_ID
        WHERE u.EMAIL = LOWER(TRIM(p_email));

        p_found := 1;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN

            p_user_id := NULL;
            p_full_name := NULL;
            p_password_hash := NULL;
            p_role_name := NULL;
            p_account_status := NULL;
            p_found := 0;

    END GET_USER_FOR_LOGIN;



    -- 3. APPROVE OR REJECT USER
    PROCEDURE APPROVE_USER (
        p_admin_user_id IN NUMBER,
        p_target_user_id IN NUMBER,
        p_action IN VARCHAR2,
        p_message OUT VARCHAR2
    )
    AS
        v_admin_count NUMBER;
        v_target_status VARCHAR2(20);
        v_action VARCHAR2(20);
    BEGIN

        v_action := UPPER(TRIM(p_action));

        IF v_action NOT IN ('APPROVED', 'REJECTED') THEN
            RAISE_APPLICATION_ERROR(
                -20004, 'Invalid approval action.'
            );
        END IF;

        -- Verify administrator
        SELECT COUNT(*)
        INTO v_admin_count
        FROM APP_USERS u
        JOIN APP_ROLES r
            ON u.ROLE_ID = r.ROLE_ID
        WHERE u.USER_ID = p_admin_user_id
          AND r.ROLE_NAME = 'ADMIN'
          AND u.ACCOUNT_STATUS = 'APPROVED';

        IF v_admin_count = 0 THEN
            RAISE_APPLICATION_ERROR(
                -20005, 'Administrator access denied.'
            );
        END IF;

        -- Lock target user while processing
        SELECT ACCOUNT_STATUS
        INTO v_target_status
        FROM APP_USERS
        WHERE USER_ID = p_target_user_id
        FOR UPDATE;

        IF v_target_status <> 'PENDING' THEN
            RAISE_APPLICATION_ERROR(
                -20006, 'User is not awaiting approval.'
            );
        END IF;

        -- Update account
        UPDATE APP_USERS
        SET
            ACCOUNT_STATUS = v_action,
            APPROVED_BY =
                CASE WHEN v_action = 'APPROVED'
                     THEN p_admin_user_id
                     ELSE NULL END,
            APPROVED_AT =
                CASE WHEN v_action = 'APPROVED'
                     THEN SYSTIMESTAMP
                     ELSE NULL END
        WHERE USER_ID = p_target_user_id;

        -- Store approval history
        INSERT INTO APPROVAL_HISTORY (
            USER_ID,
            ACTION,
            ACTION_BY
        )
        VALUES (
            p_target_user_id,
            v_action,
            p_admin_user_id
        );

        p_message := 'User successfully ' || LOWER(v_action) || '.';

    END APPROVE_USER;



    -- 4. LIST PENDING USERS
    PROCEDURE LIST_PENDING_USERS (
        p_users OUT SYS_REFCURSOR
    )
    AS
    BEGIN

        OPEN p_users FOR
            SELECT
                u.USER_ID,
                u.FULL_NAME,
                u.EMAIL,
                r.ROLE_NAME,
                u.CREATED_AT
            FROM APP_USERS u
            JOIN APP_ROLES r
                ON u.ROLE_ID = r.ROLE_ID
            WHERE u.ACCOUNT_STATUS = 'PENDING'
            ORDER BY u.CREATED_AT;

    END LIST_PENDING_USERS;



    -- 5. CHECK USER PERMISSIONS
    PROCEDURE HAS_PERMISSION (
        p_user_id IN NUMBER,
        p_permission_key IN VARCHAR2,
        p_allowed OUT NUMBER
    )
    AS
        v_count NUMBER;
    BEGIN

        SELECT COUNT(*)
        INTO v_count
        FROM APP_USERS u
        JOIN ROLE_PERMISSIONS rp
            ON u.ROLE_ID = rp.ROLE_ID
        JOIN APP_PERMISSIONS p
            ON rp.PERMISSION_ID = p.PERMISSION_ID
        WHERE u.USER_ID = p_user_id
          AND u.ACCOUNT_STATUS = 'APPROVED'
          AND p.PERMISSION_KEY = p_permission_key;

        IF v_count > 0 THEN
            p_allowed := 1;
        ELSE
            p_allowed := 0;
        END IF;

    END HAS_PERMISSION;

END RBAC_PACKAGE;
/

