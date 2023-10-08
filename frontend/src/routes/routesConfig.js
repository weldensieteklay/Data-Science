import Logout from '../components/common/Logout';
import Profile from '../components/common/Profile';
import Users from '../components/Users/Users'
import Purchases from '../components/purchases/Purchases'
const routesConfig = [
    {
        path: '/add-balance',
        component: Purchases,
        label: 'Add Balance',
        group: ['Add Balance']
    },
    {
        path: '/profile',
        component: Profile,
        label: 'Profile',
        group: ['authentication']
    },
    {
        path: '/logout',
        component: Logout,
        label: 'Logout',
        group: ['authentication']
    },
    {
        path: '/users',
        component: Users,
        label: 'Users',
        group: ['admin']
    },
];

export default routesConfig;