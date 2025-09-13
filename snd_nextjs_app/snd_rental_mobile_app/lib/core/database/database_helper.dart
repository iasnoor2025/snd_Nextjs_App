import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../constants/app_constants.dart';

class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  factory DatabaseHelper() => _instance;
  DatabaseHelper._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, AppConstants.databaseName);

    return await openDatabase(
      path,
      version: AppConstants.databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    // Create employees table
    await db.execute('''
      CREATE TABLE employees (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        middleName TEXT,
        email TEXT NOT NULL,
        phone TEXT,
        mobile TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postalCode TEXT,
        country TEXT,
        nationality TEXT,
        passportNumber TEXT,
        iqamaNumber TEXT,
        drivingLicenseNumber TEXT,
        dateOfBirth TEXT,
        gender TEXT,
        maritalStatus TEXT,
        bloodType TEXT,
        emergencyContactName TEXT,
        emergencyContactPhone TEXT,
        emergencyContactRelationship TEXT,
        profileImageUrl TEXT,
        position TEXT,
        department TEXT,
        employmentType TEXT,
        hireDate TEXT,
        terminationDate TEXT,
        status TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    ''');

    // Create projects table
    await db.execute('''
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        clientName TEXT,
        clientContact TEXT,
        clientEmail TEXT,
        clientPhone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postalCode TEXT,
        country TEXT,
        status TEXT,
        priority TEXT,
        startDate TEXT,
        endDate TEXT,
        actualStartDate TEXT,
        actualEndDate TEXT,
        budget REAL,
        actualCost REAL,
        currency TEXT,
        projectManagerId TEXT,
        projectManagerName TEXT,
        teamMemberIds TEXT,
        teamMemberNames TEXT,
        equipmentIds TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    ''');

    // Create equipment table
    await db.execute('''
      CREATE TABLE equipment (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        subcategory TEXT,
        brand TEXT,
        model TEXT,
        serialNumber TEXT,
        assetTag TEXT,
        status TEXT,
        condition TEXT,
        location TEXT,
        assignedProjectId TEXT,
        assignedProjectName TEXT,
        assignedEmployeeId TEXT,
        assignedEmployeeName TEXT,
        purchaseDate TEXT,
        purchasePrice REAL,
        currency TEXT,
        warrantyExpiry TEXT,
        lastMaintenanceDate TEXT,
        nextMaintenanceDate TEXT,
        maintenanceIntervalDays INTEGER,
        maintenanceNotes TEXT,
        specifications TEXT,
        imageUrl TEXT,
        qrCode TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    ''');

    // Create rentals table
    await db.execute('''
      CREATE TABLE rentals (
        id TEXT PRIMARY KEY,
        rentalNumber TEXT NOT NULL,
        customerId TEXT NOT NULL,
        customerName TEXT NOT NULL,
        customerEmail TEXT NOT NULL,
        customerPhone TEXT NOT NULL,
        projectId TEXT,
        projectName TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postalCode TEXT,
        country TEXT,
        status TEXT NOT NULL,
        priority TEXT,
        startDate TEXT,
        endDate TEXT,
        actualStartDate TEXT,
        actualEndDate TEXT,
        totalAmount REAL,
        paidAmount REAL,
        balanceAmount REAL,
        currency TEXT,
        paymentStatus TEXT,
        paymentMethod TEXT,
        notes TEXT,
        terms TEXT,
        createdById TEXT,
        createdByName TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    ''');

    // Create sync_status table for offline sync
    await db.execute('''
      CREATE TABLE sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tableName TEXT NOT NULL,
        recordId TEXT NOT NULL,
        operation TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        UNIQUE(tableName, recordId, operation)
      )
    ''');

    // Create indexes for better performance
    await db.execute('CREATE INDEX idx_employees_status ON employees(status)');
    await db.execute('CREATE INDEX idx_employees_department ON employees(department)');
    await db.execute('CREATE INDEX idx_projects_status ON projects(status)');
    await db.execute('CREATE INDEX idx_projects_client ON projects(clientName)');
    await db.execute('CREATE INDEX idx_equipment_status ON equipment(status)');
    await db.execute('CREATE INDEX idx_equipment_category ON equipment(category)');
    await db.execute('CREATE INDEX idx_rentals_status ON rentals(status)');
    await db.execute('CREATE INDEX idx_rentals_customer ON rentals(customerId)');
    await db.execute('CREATE INDEX idx_sync_status_synced ON sync_status(synced)');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Handle database upgrades here
    // For now, we'll just recreate the database
    await _onCreate(db, newVersion);
  }

  // Employee CRUD operations
  Future<int> insertEmployee(Map<String, dynamic> employee) async {
    final db = await database;
    return await db.insert('employees', employee);
  }

  Future<List<Map<String, dynamic>>> getEmployees({
    int? limit,
    int? offset,
    String? status,
    String? department,
  }) async {
    final db = await database;
    
    String query = 'SELECT * FROM employees WHERE 1=1';
    List<dynamic> args = [];

    if (status != null) {
      query += ' AND status = ?';
      args.add(status);
    }

    if (department != null) {
      query += ' AND department = ?';
      args.add(department);
    }

    query += ' ORDER BY createdAt DESC';

    if (limit != null) {
      query += ' LIMIT ?';
      args.add(limit);
    }

    if (offset != null) {
      query += ' OFFSET ?';
      args.add(offset);
    }

    return await db.rawQuery(query, args);
  }

  Future<Map<String, dynamic>?> getEmployeeById(String id) async {
    final db = await database;
    final result = await db.query(
      'employees',
      where: 'id = ?',
      whereArgs: [id],
    );
    return result.isNotEmpty ? result.first : null;
  }

  Future<int> updateEmployee(String id, Map<String, dynamic> employee) async {
    final db = await database;
    return await db.update(
      'employees',
      employee,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> deleteEmployee(String id) async {
    final db = await database;
    return await db.delete(
      'employees',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Project CRUD operations
  Future<int> insertProject(Map<String, dynamic> project) async {
    final db = await database;
    return await db.insert('projects', project);
  }

  Future<List<Map<String, dynamic>>> getProjects({
    int? limit,
    int? offset,
    String? status,
    String? clientName,
  }) async {
    final db = await database;
    
    String query = 'SELECT * FROM projects WHERE 1=1';
    List<dynamic> args = [];

    if (status != null) {
      query += ' AND status = ?';
      args.add(status);
    }

    if (clientName != null) {
      query += ' AND clientName = ?';
      args.add(clientName);
    }

    query += ' ORDER BY createdAt DESC';

    if (limit != null) {
      query += ' LIMIT ?';
      args.add(limit);
    }

    if (offset != null) {
      query += ' OFFSET ?';
      args.add(offset);
    }

    return await db.rawQuery(query, args);
  }

  Future<Map<String, dynamic>?> getProjectById(String id) async {
    final db = await database;
    final result = await db.query(
      'projects',
      where: 'id = ?',
      whereArgs: [id],
    );
    return result.isNotEmpty ? result.first : null;
  }

  Future<int> updateProject(String id, Map<String, dynamic> project) async {
    final db = await database;
    return await db.update(
      'projects',
      project,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> deleteProject(String id) async {
    final db = await database;
    return await db.delete(
      'projects',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Sync status operations
  Future<int> insertSyncStatus({
    required String tableName,
    required String recordId,
    required String operation,
  }) async {
    final db = await database;
    return await db.insert('sync_status', {
      'tableName': tableName,
      'recordId': recordId,
      'operation': operation,
      'timestamp': DateTime.now().toIso8601String(),
      'synced': 0,
    });
  }

  Future<List<Map<String, dynamic>>> getPendingSyncRecords() async {
    final db = await database;
    return await db.query(
      'sync_status',
      where: 'synced = ?',
      whereArgs: [0],
      orderBy: 'timestamp ASC',
    );
  }

  Future<int> markSyncRecordAsSynced(int syncId) async {
    final db = await database;
    return await db.update(
      'sync_status',
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [syncId],
    );
  }

  // Clear all data
  Future<void> clearAllData() async {
    final db = await database;
    await db.delete('employees');
    await db.delete('projects');
    await db.delete('equipment');
    await db.delete('rentals');
    await db.delete('sync_status');
  }

  // Close database
  Future<void> close() async {
    final db = await database;
    await db.close();
  }
}
