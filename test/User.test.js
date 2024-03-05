const User = require("../models/User");
const bcrypt = require("bcrypt");

var idUser;

test("O método deve cadastrar o usuário e suas permissões conforme as informações passadas", async () => {
    const data = {
        name: "User Teste",
        email: "user.teste@email.com",
        login: "user.teste",
        password: "password@123",
        phone: "(12) 34567-8901",
        profiles: ["7DNw8nxDBvl7eCgYWi7g", "fPx4Yz9wJnPCpzrhhOUa"]
    }

    const user = new User(data);
    const createRes = await user.CreateUser();

    idUser = createRes.id;

    if(createRes.loginExists || createRes.emailExists) {
        expect(createRes.hasError).toBe(true);
        expect(createRes.hasProfileCreationError).toBe(true);
    } else {
        expect(createRes.hasError).toBe(false);
        expect(createRes.hasProfileCreationError).toBe(false);
    }
});

test("O método deve retornar se um usuário existe pelo login dele, e popular os atributos do objeto com suas informações", async () => {
    const data = {
        login: "user.teste"
    }

    const user = new User(data);
    const userExists = await user.GetUserByLogin();

    expect(userExists).toBe(true);

    if(!idUser) {
        idUser = user.id;
    }
});

test(`O método deve retornar todas as informações de cadastro de um user para um idUser específico,
para que exiba as informações a serem alteradas`, async () => {
    const data = {
        id: idUser
    }

    const user = new User(data);
    const userToEdit = await user.GetUserById();
    
    if(idUser) {
        const isPasswordCorrect = bcrypt.compareSync("password@123", userToEdit.data().password);
        expect(userToEdit.data().name).toEqual("User Teste");
        expect(userToEdit.data().email).toEqual("user.teste@email.com");
        expect(userToEdit.data().login).toEqual("user.teste");
        expect(isPasswordCorrect).toBe(true);
        expect(userToEdit.data().phone).toEqual("(12) 34567-8901");
    } else {
        expect(userToEdit.success).toBe(false);
    }
});

test("O método deve retornar os users_profiles correspondente ao idUser que foi selecionado para alteração", async () => {
    const data = {
        id: idUser
    }

    const user = new User(data);
    var userProfiles = [];
    const userProfilesQuery = await user.GetUsersProfilesByUserId();

    userProfilesQuery.docs.map(doc => {
        userProfiles.push(doc.data().idProfile);
    });
    
    expect(userProfiles.sort()).toEqual(["fPx4Yz9wJnPCpzrhhOUa", "7DNw8nxDBvl7eCgYWi7g"].sort());
});

test("O método deve atualizar o usuário e suas permissões, correspondentes ao idUser informado, conforme as informações passadas", async () => {
    const data = {
        id: idUser,
        name: "User Update",
        email: "user.teste@email.com",
        login: "user.teste",
        password: "password@123",
        phone: "(13) 11111-1111",
        profiles: ["7DNw8nxDBvl7eCgYWi7g", "65374870943"]
    }

    const user = new User(data);
    const updateRes = await user.UpdateUser();
    const profilesQuery = await user.GetUsersProfilesByUserId();
    var userProfiles = [];

    profilesQuery.docs.map(doc => {
        userProfiles.push(doc.data().idProfile);
    });

    if(updateRes.loginExists || updateRes.emailExists || updateRes.hasError) {
        expect(updateRes.hasError).toBe(true);
        expect(updateRes.hasProfileUpdateError).toBe(true);
    } else {
        expect(updateRes.hasError).toBe(false);
        expect(updateRes.hasProfileUpdateError).toBe(false);
        expect(userProfiles.sort()).toEqual(data.profiles.sort());
    }
});

test("O método deve deletar todos os registros de users e users_profiles para um idUser específico", async () => {
    const data = {
        id: idUser
    }

    const user = new User(data);

    await expect(user.DeleteUser()).resolves.toBe(true);
});