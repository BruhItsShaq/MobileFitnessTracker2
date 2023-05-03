import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { login } from '../firebase/dbRequests';
import EmailValidator from 'email-validator';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
        return passwordRegex.test(password);
    };

    const handleLogin = async () => {

        setError('');

        if (!validatePassword(password)) {
            setError("Password isn't strong enough (One upper, one lower, one special, one number, at least 8 characters long)");
            return;
        }

        if (!EmailValidator.validate(email)) {
            this.setState({ error: 'Must enter valid email' });
            return;
        }
        try {
            const userData = await login(email, password);
            console.log(userData);
            // Navigate to the main tab navigator screen
            navigation.navigate('Main');
        } catch (error) {
            console.error(error);
            setError(error.message);
        }
    };

    // const handleSignUpLink = () => {
    //     navigation.navigate('SignUp'); // navigate to the 'SignUp' screen
    // };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupText}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginVertical: 8,
        width: '80%',
    },
    button: {
        backgroundColor: '#2196f3',
        padding: 12,
        borderRadius: 4,
        marginTop: 16,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    error: {
        color: 'red',
        marginTop: 8,
    },
    signupLink: {
        marginTop: 24,
    },
    signupText: {
        color: 'blue',
        textDecorationLine: 'underline',
    }
});

export default LoginScreen;