import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { getUserData, editUserData, logoutUser } from '../firebase/dbRequests';

const ProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState({});
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getUserData();
            setUserData(data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleEdit = async () => {
        if (editMode) {
            try {
                const { password, ...updatedData } = userData;
                await editUserData(updatedData);
                Alert.alert('Profile updated successfully!');
            } catch (error) {
                console.error('Error updating profile:', error);
                Alert.alert('Error updating profile. Please try again.');
            }
        }
        setEditMode(!editMode);
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
            // Navigate to the login screen after successful logout
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error logging out. Please try again.');
        }
    };

    const renderField = (label, key) => {
        return (
            <View style={styles.field}>
                <Text style={styles.label}>{label}:</Text>
                {editMode ? (
                    <TextInput
                        style={styles.input}
                        value={userData[key]}
                        onChangeText={(text) => setUserData({ ...userData, [key]: text })}
                    />
                ) : (
                    <Text style={styles.value}>{userData[key]}</Text>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderField('Username', 'username')}
            {renderField('Email', 'email')}
            {renderField('Gender', 'gender')}
            {renderField('Goal', 'goal')}
            {renderField('Height', 'height')}
            {renderField('Weight', 'weight')}
            {renderField('Calorie Goal', 'calorie_goal')}
            {renderField('Sleep Goal', 'sleep_goal')}

            <TouchableOpacity style={styles.button} onPress={handleEdit}>
                <Text style={styles.buttonText}>{editMode ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}
            >
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
    },
    value: {
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        padding: 5,
        fontSize: 16,
        minWidth: 100,
        textAlign: 'right',
    },
    button: {
        backgroundColor: '#1a73e8',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    logoutButton: {
        backgroundColor: '#e53935',
    },
});

export default ProfileScreen;
