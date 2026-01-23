from app import models, database

db = database.SessionLocal()

# Delete all devices (we're using the simulator now)
devices = db.query(models.Device).all()
for d in devices:
    print(f"Removing: {d.name} ({d.ip_address})")
    db.delete(d)
db.commit()
print("Done - all devices removed. Using simulator only.")
db.close()
