const functions = require("firebase-functions");
var admin = require('firebase-admin');
const cors = require("cors")({ origin: true });
// var serviceAccount = require('./mobilefitnesstracker-8dae7-firebase-adminsdk-iz685-49bfa64b97.json');


// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: 'https://mobilefitnesstracker-8dae7-default-rtdb.europe-west1.firebasedatabase.app',
// });
admin.initializeApp();

exports.newupdateUserData = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const authToken = req.header('Authorization');
        if (!authToken) {
            res.status(401).send('User must be authenticated');
            return;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(authToken.replace('Bearer ', ''));
            const { userId, caloriesBurned, caloriesEaten, steps } = req.body.data;

            console.log('Input values:', {
                caloriesBurned,
                caloriesEaten,
                steps,
            });

            if (decodedToken.uid !== userId) {
                res.status(401).send(`User ID does not match the authenticated user. Expected: ${decodedToken.uid}, Actual: ${userId}`);
                return;
            }

            const userRef = admin.database().ref(`users/${userId}`);
            userRef.once('value', async (snapshot) => {
                if (!snapshot.exists()) {
                    res.status(404).send('User not found');
                    return;
                }

                const userData = snapshot.val();
                console.log('userData before updating:', userData);

                const newCaloriesBurned = userData.total_calories_burned + caloriesBurned;
                const newCaloriesEaten = userData.total_calories_eaten + caloriesEaten;
                const newSteps = userData.total_steps + steps;

                console.log('newCaloriesBurned:', newCaloriesBurned);
                console.log('newCaloriesEaten:', newCaloriesEaten);
                console.log('newSteps:', newSteps);

                await userRef.update({
                    total_calories_burned: newCaloriesBurned,
                    total_calories_eaten: newCaloriesEaten,
                    total_steps: newSteps,
                });

                const updatedSnapshot = await userRef.once('value');
                const updatedUserData = updatedSnapshot.val();
                console.log('userData after updating:', updatedUserData);

                res.status(200).json({
                    message: 'User data updated successfully',
                    data: {
                        newCaloriesBurned,
                        newCaloriesEaten,
                        newSteps,
                    },
                });

            });
        } catch (error) {
            res.status(500).send('Error: ' + error.message);
        }
    });
});



exports.resetDailyUserData = functions.pubsub.schedule('0 0 * * *').timeZone('Europe/London').onRun(async (context) => {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const batch = admin.firestore().batch();

    usersSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
            total_calories_burned: 0,
            total_calories_eaten: 0,
            total_steps: 0,
        });
    });

    await batch.commit();
    console.log('Daily user data reset successfully');
});